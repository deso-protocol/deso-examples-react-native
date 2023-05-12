import { decryptChatMessage, encryptChatMessage, keygen, publicKeyToBase58Check as getPublicKey } from 'deso-protocol';
import { StatusBar } from 'expo-status-bar';
import { Button, Text, View, TextInput } from 'react-native';
import { deriveAccessGroupKeyPair, signTx } from "deso-protocol/src/identity/crypto-utils";
import { constructCreateAccessGroupTransaction } from "deso-protocol/src/transactions/access-groups";
import { identity } from "deso-protocol/src/identity/identity";
import { KeyPair } from "deso-protocol/src/identity/types";
import { constructSendDMTransaction, sendDMMessage } from "deso-protocol/src/transactions/social";
import { getPaginatedDMThread, getUsersStateless } from "deso-protocol/src/data/data";
import React, { useState } from "react";
import { configure } from "deso-protocol/src/deso-protocol";



export const DEFAULT_KEY = "default-key";
const publicKeyToBase58Check = (publicKey: Uint8Array) => getPublicKey(publicKey, { network: "testnet"});
export default function LowLevelMessaging({ navigation }: { navigation: any }) {
  configure({
    nodeURI: "https://test.deso.org",
    network: "testnet",
  })
  const [keyPair1, setKeyPair1] = useState<KeyPair | null>(null);
  const [accessGroupKeyPair1, setAccessGroupKeyPair1] = useState<KeyPair | null>(null);
  const [message1, setMessage1] = useState<string>("");
  const [keyPair2, setKeyPair2] = useState<KeyPair | null>(null);
  const [accessGroupKeyPair2, setAccessGroupKeyPair2] = useState<KeyPair | null>(null);
  const [message2, setMessage2] = useState<string>("");
  const [balance1, setBalance1] = useState<number | null>(null);
  const [balance2, setBalance2] = useState<number | null>(null);
  const [activeUser, setActiveUser] = useState<number>(1);
  const [messageThread, setMessageThread] = useState<any[]>([]);
  const createAccessGroup = async (keyPair: KeyPair, groupKeyName: string) => {
    const accessGroupKeyPair = deriveAccessGroupKeyPair(keyPair.seedHex, groupKeyName);
    const unsignedTx = await constructCreateAccessGroupTransaction({
      AccessGroupKeyName: groupKeyName,
      AccessGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(keyPair.public),
      AccessGroupPublicKeyBase58Check: publicKeyToBase58Check(accessGroupKeyPair.public),
    });
    const signedTx = await signTx(unsignedTx.TransactionHex, keyPair.seedHex);
    const submitTxRes = await identity.submitTx(signedTx);
    return {
      accessGroupKeyPair,
      unsignedTx,
      signedTx,
      submitTxRes,
    }
  };

  const sendMessage = async (
    senderKeyPair: KeyPair,
    senderAccessGroupKeyPair: KeyPair,
    senderAccessGroupKeyName: string,
    recipientPublicKeyBase58Check: string,
    recipientAccessGroupPublicKeyBase58Check: string,
    recipientAccessGroupKeyName: string,
    message: string) => {
    const encryptedMessage = await encryptChatMessage(senderAccessGroupKeyPair.seedHex, recipientAccessGroupPublicKeyBase58Check, message);
    const unsignedTx = await sendDMMessage({
      SenderAccessGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(senderKeyPair.public),
      SenderAccessGroupPublicKeyBase58Check: publicKeyToBase58Check(senderAccessGroupKeyPair.public),
      SenderAccessGroupKeyName: senderAccessGroupKeyName,
      RecipientAccessGroupOwnerPublicKeyBase58Check: recipientPublicKeyBase58Check,
      RecipientAccessGroupPublicKeyBase58Check: recipientAccessGroupPublicKeyBase58Check,
      RecipientAccessGroupKeyName: recipientAccessGroupKeyName,
      EncryptedMessageText: encryptedMessage,
    }, {
      broadcast: false,
    })
    // TODO: Why isn't local construction working?
    // const unsignedTx = await constructSendDMTransaction({
    //   SenderAccessGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(senderKeyPair.public),
    //   SenderAccessGroupPublicKeyBase58Check: publicKeyToBase58Check(senderAccessGroupKeyPair.public),
    //   SenderAccessGroupKeyName: senderAccessGroupKeyName,
    //   RecipientAccessGroupOwnerPublicKeyBase58Check: recipientPublicKeyBase58Check,
    //   RecipientAccessGroupPublicKeyBase58Check: recipientAccessGroupPublicKeyBase58Check,
    //   RecipientAccessGroupKeyName: recipientAccessGroupKeyName,
    //   EncryptedMessageText: encryptedMessage,
    // });
    const signedTx = await signTx(unsignedTx.constructedTransactionResponse.TransactionHex, senderKeyPair.seedHex);
    const submitTxRes = await identity.submitTx(signedTx);
    return {
      encryptedMessage,
      unsignedTx,
      signedTx,
      submitTxRes,
    }
  };

  const getMessageThread = async () => {
    const activeUserKeyPair = activeUser === 1 ? keyPair1 : keyPair2;
    const otherUserKeyPair = activeUser === 1 ? keyPair2 : keyPair1;
    const activeAccessGroupKeyPair = activeUser === 1 ? accessGroupKeyPair1 : accessGroupKeyPair2;
    const dmThread = await getPaginatedDMThread({
      UserGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(activeUserKeyPair?.public as Uint8Array),
      UserGroupKeyName: DEFAULT_KEY,
      PartyGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(otherUserKeyPair?.public as Uint8Array),
      PartyGroupKeyName: DEFAULT_KEY,
      MaxMessagesToFetch: 100,
      StartTimeStamp: new Date().valueOf() * 1e6,
    });

    const threadMessages = await Promise.all(dmThread.ThreadMessages.map(async (message) => {
      const isSender = message.SenderInfo.OwnerPublicKeyBase58Check === publicKeyToBase58Check(keyPair1?.public as Uint8Array, );
      const publicDecryptionKey = isSender ? message.RecipientInfo.AccessGroupPublicKeyBase58Check : message.SenderInfo.AccessGroupPublicKeyBase58Check;
      const decryptedMessage = await decryptChatMessage(activeAccessGroupKeyPair?.seedHex as string, publicDecryptionKey, message.MessageInfo.EncryptedText);
      return {
        ...message,
        ... { DecryptedMessage: decryptedMessage, IsSender: isSender },
      };
    }));
    setMessageThread(threadMessages);
  }

  const refreshBalances = async () => {
    if (!keyPair1 || !keyPair2) return;
    const { UserList } = await getUsersStateless({
      PublicKeysBase58Check: [publicKeyToBase58Check(keyPair1.public), publicKeyToBase58Check(keyPair2.public)],
      SkipForLeaderboard: true,
      IncludeBalance: true,
    });
    (UserList || []).forEach((user) => {
      if (user.PublicKeyBase58Check === publicKeyToBase58Check(keyPair1.public)) {
        setBalance1(user.BalanceNanos);
      }
      if (user.PublicKeyBase58Check === publicKeyToBase58Check(keyPair2.public)) {
        setBalance2(user.BalanceNanos);
      }
    })
  }

  return (
    keyPair1 && keyPair2 ?
      <View>
        <Text>Key Pair 1 Public Key: </Text><Text selectable={true}>{publicKeyToBase58Check(keyPair1.public)}</Text>
        <Text>Key Pair 1 Balance: {balance1} nanos</Text>
        <Text>Key Pair 2 Public Key: </Text><Text selectable={true}>{publicKeyToBase58Check(keyPair2.public)}</Text>
        <Text>Key Pair 2 Balance: {balance2} nanos</Text>
        <Button title="Refresh Balances" onPress={async () => {
          await refreshBalances();
        }}/>
        {
          !accessGroupKeyPair1 && !accessGroupKeyPair2 ?
            <Button
              title="Create Access Groups"
              onPress={async () => {
                const [accessGroup1Res, accessGroup2Res] = await Promise.all([
                  createAccessGroup(keyPair1, DEFAULT_KEY),
                  createAccessGroup(keyPair2, DEFAULT_KEY),
                ]);
                console.log(accessGroup1Res, accessGroup2Res);
                setAccessGroupKeyPair1(accessGroup1Res.accessGroupKeyPair);
                setAccessGroupKeyPair2(accessGroup2Res.accessGroupKeyPair);
              }} /> :
            <View>
              <TextInput onChangeText={(text) => setMessage1(text)}/>
              <Button
                title="Send message from user1"
                onPress={() => sendMessage(keyPair1, accessGroupKeyPair1 as KeyPair, DEFAULT_KEY, publicKeyToBase58Check(keyPair2.public), publicKeyToBase58Check(accessGroupKeyPair2?.public as Uint8Array), DEFAULT_KEY, message1)}/>
              <TextInput onChangeText={(text) => setMessage2(text)}/>
              <Button
                title="Send message from user2"
                onPress={() => sendMessage(keyPair2, accessGroupKeyPair2 as KeyPair, DEFAULT_KEY, publicKeyToBase58Check(keyPair1.public), publicKeyToBase58Check(accessGroupKeyPair1?.public as Uint8Array), DEFAULT_KEY, message2)}/>
              <View>
                <Button title="refresh messages" onPress={() => getMessageThread()}/>
                <Text>Message Thread</Text>
                {
                  messageThread.map((message) => {
                    return (
                      <View key={message.MessageInfo.TstampNanos}>
                        <Text>{message.SenderInfo.OwnerPublicKeyBase58Check} sent "{message.DecryptedMessage}"</Text>
                      </View>
                    )
                  })
                }
              </View>
            </View>
        }

      </View> : <Button title="Generate Key Pairs" onPress={() => {
        setKeyPair1(keygen());
        setKeyPair2(keygen());
      }}/>
  );
}
