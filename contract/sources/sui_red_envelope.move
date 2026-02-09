module sui_red_envelope::sui_red_envelope {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::random::{Self, Random};

    /// Error codes
    const EZeroAmount: u64 = 0;
    const EZeroCount: u64 = 1;
    const EEnvelopeEmpty: u64 = 2;
    const EAlreadyClaimed: u64 = 3;
    const ENotOwner: u64 = 4;

    /// Red Envelope Mode
    const MODE_RANDOM: u8 = 0;
    const MODE_EQUAL: u8 = 1;

    /// The Red Envelope Object
    struct RedEnvelope<phantom T> has key, store {
        id: UID,
        owner: address,
        balance: Balance<T>,
        total_amount: u64,
        remaining_count: u64,
        total_count: u64,
        mode: u8,
        claimed_list: Table<address, bool>,
    }

    /// Event emitted when a new Red Envelope is created
    struct EnvelopeCreated has copy, drop {
        id: ID,
        owner: address,
        amount: u64,
        count: u64,
        mode: u8,
    }

    /// Event emitted when a Red Envelope is claimed
    struct EnvelopeClaimed has copy, drop {
        id: ID,
        claimer: address,
        amount: u64,
    }

    /// Create a new Red Envelope
    public entry fun create_red_envelope<T>(
        coin: Coin<T>,
        count: u64,
        mode: u8,
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
            claimed_list: table::new(ctx),
        };

        event::emit(EnvelopeCreated {
            id: object::id(&envelope),
            owner: sender,
            amount,
            count,
            mode,
        });

        transfer::share_object(envelope);
    }

    /// Claim a Red Envelope
    /// For random mode, we use the `Random` object from Sui Framework
    entry fun claim_red_envelope<T>(
        envelope: &mut RedEnvelope<T>,
        r: &Random,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if envelope is empty
        assert!(envelope.remaining_count > 0, EEnvelopeEmpty);
        
        // Check if already claimed
        assert!(!table::contains(&envelope.claimed_list, sender), EAlreadyClaimed);

        let claim_amount;
        
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
            
            let possible_max = avg * 2;
            if (possible_max >= remaining_balance) { 
                possible_max = remaining_balance - envelope.remaining_count + 1; 
            };
            
            let generator = random::new_generator(r, ctx);
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
        
        let value = balance::value(&envelope.balance);
        if (value > 0) {
            let remaining = coin::take(&mut envelope.balance, value, ctx);
            transfer::public_transfer(remaining, sender);
        }
    }
}
