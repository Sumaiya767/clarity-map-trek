import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure users can create trails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("map-trek", "create-trail", [
        types.utf8("Mountain Loop"),
        types.utf8("Beautiful mountain trail with scenic views"),
        types.uint(3),
        types.list([
          types.tuple({lat: types.int(45000000), lng: types.int(-122000000)}),
          types.tuple({lat: types.int(45100000), lng: types.int(-122100000)})
        ])
      ], wallet_1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 2);
    assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
  }
});

Clarinet.test({
  name: "Ensure only trail creator can share trails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("map-trek", "create-trail", [
        types.utf8("Forest Path"),
        types.utf8("Peaceful forest trail"),
        types.uint(2),
        types.list([
          types.tuple({lat: types.int(45000000), lng: types.int(-122000000)})
        ])
      ], wallet_1.address),
      
      Tx.contractCall("map-trek", "share-trail", [
        types.uint(1),
        types.principal(wallet_2.address)
      ], wallet_2.address)
    ]);

    assertEquals(block.receipts[1].result.expectErr(), types.uint(401));
  }
});

Clarinet.test({
  name: "Ensure users can add valid reviews",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("map-trek", "create-trail", [
        types.utf8("Lake Trail"),
        types.utf8("Trail around the lake"),
        types.uint(1),
        types.list([
          types.tuple({lat: types.int(45000000), lng: types.int(-122000000)})
        ])
      ], wallet_1.address),
      
      Tx.contractCall("map-trek", "add-review", [
        types.uint(1),
        types.uint(5),
        types.utf8("Great trail!")
      ], wallet_2.address)
    ]);

    assertEquals(block.receipts[1].result.expectOk(), true);
  }
});
