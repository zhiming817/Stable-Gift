module sui_red_envelope::sui_red_envelope {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::random::{Self, Random};
    use sui::ed25519;
    use sui::address;
    use std::vector;

    /// Error codes
    const EZeroAmount: u64 = 0;
    const EZeroCount: u64 = 1;
    const EEnvelopeEmpty: u64 = 2;
    const EAlreadyClaimed: u64 = 3;
    const ENotOwner: u64 = 4;
    const EInvalidSignature: u64 = 5;

    /// Red Envelope Mode
    const MODE_RANDOM: u8 = 0;
    const MODE_EQUAL: u8 = 1;

    /// Global Registry to store configuration
    public struct Registry has key {
        id: UID,
        admin: address,
        public_key: vector<u8>, // The verification server's public key
    }

    /// Admin capability
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Events
    public struct EnvelopeCreated<phantom T> has copy, drop {
        id: ID,
        owner: address,
        amount: u64,
        count: u64,
        mode: u8,
        requires_verification: bool,
    }

    public struct EnvelopeClaimed has copy, drop {
        id: ID,
        claimer: address,
        amount: u64,
    }

    /// The Red Envelope Object
    public struct RedEnvelope<phantom T> has key, store {
        id: UID,
        owner: address,
        balance: Balance<T>,
        total_amount: u64,
        remaining_count: u64,
        total_count: u64,
        mode: u8,
        requires_verification: bool, // New field for task verification
        claimed_list: Table<address, bool>,
    }

    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        transfer::share_object(Registry {
            id: object::new(ctx),
            admin: sender,
            public_key: b"placeholder_pubkey_replace_with_real_one",
        });
        transfer::transfer(AdminCap { id: object::new(ctx) }, sender);
    }

    /// Update the trusted signer public key (Admin only)
    public entry fun update_public_key(
        _cap: &AdminCap,
        registry: &mut Registry,
        new_pk: vector<u8>,
    ) {
        registry.public_key = new_pk;
    }

    /// Create a new Red Envelope
    public entry fun create_red_envelope<T>(
        coin: Coin<T>,
        count: u64,
        mode: u8,
        requires_verification: bool,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        assert!(amount > 0, EZeroAmount);
        assert!(count > 0, EZeroCount);

        let balance = coin::into_balance(coin);
        let sender = tx_context::sender(ctx);
        
        let id = object::new(ctx);
        let envelope = RedEnvelope {
            id,
            owner: sender,
            balance,
            total_amount: amount,
            remaining_count: count,
            total_count: count,
            mode,
            requires_verification,
            claimed_list: table::new(ctx),
        };

        event::emit(EnvelopeCreated<T> {
            id: object::id(&envelope),
            owner: sender,
            amount,
            count,
            mode,
            requires_verification,
        });

        transfer::share_object(envelope);
    }

    /// Claim a Red Envelope
    entry fun claim_red_envelope<T>(
        envelope: &mut RedEnvelope<T>,
        registry: &Registry, // Added Registry to get public key
        r: &Random,
        signature: vector<u8>, // Added signature param
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verification Logic
        if (envelope.requires_verification) {
            // Message structure: EnvelopeID (32 bytes) + Claimer Address (32 bytes)
            let mut msg = object::id_bytes(envelope);
            vector::append(&mut msg, sui::address::to_bytes(sender));
            
            assert!(
                ed25519::ed25519_verify(&signature, &registry.public_key, &msg),
                EInvalidSignature
            );
        };

        // Check if envelope is empty
        assert!(envelope.remaining_count > 0, EEnvelopeEmpty);
        
        // Check if already claimed
        assert!(!table::contains(&envelope.claimed_list, sender), EAlreadyClaimed);

        let mut claim_amount;
        
        if (envelope.remaining_count == 1) {
            // Last one takes all remaining balance
            claim_amount = balance::value(&envelope.balance);
        } else if (envelope.mode == MODE_EQUAL) {
            // Equal split: Total / Total Count
            // Note: This might leave dust if not perfectly divisible, ensuring last one cleans up.
            // Better strategy: Remaining Balance / Remaining Count
            claim_amount = balance::value(&envelope.balance) / envelope.remaining_count;
        } else {
            // Random Mode
            let remaining_balance = balance::value(&envelope.balance);
            let avg = remaining_balance / envelope.remaining_count;
            
            let mut possible_max = avg * 2;
            if (possible_max >= remaining_balance) { 
                possible_max = remaining_balance - envelope.remaining_count + 1; 
            };
            
            let mut generator = random::new_generator(r, ctx);
            claim_amount = random::generate_u64_in_range(&mut generator, 1, possible_max);
        };


        // Update state
        envelope.remaining_count = envelope.remaining_count - 1;
        table::add(&mut envelope.claimed_list, sender, true);

        // Disburse funds
        let claimed_coin = coin::take(&mut envelope.balance, claim_amount, ctx);
        transfer::public_transfer(claimed_coin, sender);

        event::emit(EnvelopeClaimed {
            id: object::id(envelope),
            claimer: sender,
            amount: claim_amount,
        });
    }

    /// Recycle remaining funds (Only Owner)
    public entry fun withdraw_remaining<T>(
        envelope: &mut RedEnvelope<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == envelope.owner, ENotOwner);

        // Set remaining_count to 0 to stop further claims
        envelope.remaining_count = 0;
        
        let value = balance::value(&envelope.balance);
        if (value > 0) {
            let remaining = coin::take(&mut envelope.balance, value, ctx);
            transfer::public_transfer(remaining, sender);
        }
    }
}
