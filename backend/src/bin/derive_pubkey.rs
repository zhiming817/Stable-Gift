use ed25519_dalek::SigningKey;
use hex;

fn main() {
    let secret_hex = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    let secret_bytes = hex::decode(secret_hex).unwrap();
    let signing_key = SigningKey::from_bytes(secret_bytes.as_slice().try_into().unwrap());
    let public_key = signing_key.verifying_key();
    println!("Public Key (Hex): 0x{}", hex::encode(public_key.to_bytes()));
}
