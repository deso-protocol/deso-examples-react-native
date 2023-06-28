import {
  KeyPair,
  configure,
  constructCreateAccessGroupTransaction,
  decryptChatMessage,
  deriveAccessGroupKeyPair,
  encryptChatMessage,
  getPaginatedDMThread,
  publicKeyToBase58Check as getPublicKey,
  getUsersStateless,
  identity,
  keygen,
  sendDMMessage,
  signTx
} from "deso-protocol";
import { useEffect, useState } from "react";
import { Button, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import StyledButton from "./Shared/StyledButton";
import CopyToClipboard from "./Shared/CopyToClipboard";
import StyledCard from "./Shared/StyledCard";
import StyledMessage from "./Shared/StyledMessage";
import StyledInput from "./Shared/StyledInput";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F2F2",
    padding: 12
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4
  }
});

export const DEFAULT_KEY = "default-key";
const publicKeyToBase58Check = (publicKey: Uint8Array) =>
  getPublicKey(publicKey, { network: "testnet" });
export default function LowLevelMessaging({ navigation }: { navigation: any }) {
  configure({
    nodeURI: "https://test.deso.org",
    network: "testnet",
  });
  const [keyPair1, setKeyPair1] = useState<KeyPair | null>(null);
  const [accessGroupKeyPair1, setAccessGroupKeyPair1] =
    useState<KeyPair | null>(null);
  const [message1, setMessage1] = useState<string>("");
  const [keyPair2, setKeyPair2] = useState<KeyPair | null>(null);
  const [accessGroupKeyPair2, setAccessGroupKeyPair2] =
    useState<KeyPair | null>(null);
  const [message2, setMessage2] = useState<string>("");
  const [balance1, setBalance1] = useState<number | null>(null);
  const [balance2, setBalance2] = useState<number | null>(null);
  const [activeUser, setActiveUser] = useState<number>(1);
  const [messageThread, setMessageThread] = useState<any[]>([]);
  const createAccessGroup = async (keyPair: KeyPair, groupKeyName: string) => {
    const accessGroupKeyPair = deriveAccessGroupKeyPair(
      keyPair.seedHex,
      groupKeyName
    );
    const unsignedTx = await constructCreateAccessGroupTransaction({
      AccessGroupKeyName: groupKeyName,
      AccessGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(
        keyPair.public
      ),
      AccessGroupPublicKeyBase58Check: publicKeyToBase58Check(
        accessGroupKeyPair.public
      ),
    });
    const signedTx = await signTx(unsignedTx.TransactionHex, keyPair.seedHex);
    const submitTxRes = await identity.submitTx(signedTx);
    return {
      accessGroupKeyPair,
      unsignedTx,
      signedTx,
      submitTxRes,
    };
  };

  useEffect(() => {
    setKeyPair1(keygen());
    setKeyPair2(keygen());
  }, []);

  const sendMessage = async (
    senderKeyPair: KeyPair,
    senderAccessGroupKeyPair: KeyPair,
    senderAccessGroupKeyName: string,
    recipientPublicKeyBase58Check: string,
    recipientAccessGroupPublicKeyBase58Check: string,
    recipientAccessGroupKeyName: string,
    message: string
  ) => {
    const encryptedMessage = await encryptChatMessage(
      senderAccessGroupKeyPair.seedHex,
      recipientAccessGroupPublicKeyBase58Check,
      message
    );
    const unsignedTx = await sendDMMessage(
      {
        SenderAccessGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(
          senderKeyPair.public
        ),
        SenderAccessGroupPublicKeyBase58Check: publicKeyToBase58Check(
          senderAccessGroupKeyPair.public
        ),
        SenderAccessGroupKeyName: senderAccessGroupKeyName,
        RecipientAccessGroupOwnerPublicKeyBase58Check:
          recipientPublicKeyBase58Check,
        RecipientAccessGroupPublicKeyBase58Check:
          recipientAccessGroupPublicKeyBase58Check,
        RecipientAccessGroupKeyName: recipientAccessGroupKeyName,
        EncryptedMessageText: encryptedMessage,
      },
      {
        broadcast: false,
      }
    );
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
    const signedTx = await signTx(
      unsignedTx.constructedTransactionResponse.TransactionHex,
      senderKeyPair.seedHex
    );
    const submitTxRes = await identity.submitTx(signedTx);
    return {
      encryptedMessage,
      unsignedTx,
      signedTx,
      submitTxRes,
    };
  };

  const getMessageThread = async () => {
    const activeUserKeyPair = activeUser === 1 ? keyPair1 : keyPair2;
    const otherUserKeyPair = activeUser === 1 ? keyPair2 : keyPair1;
    const activeAccessGroupKeyPair =
      activeUser === 1 ? accessGroupKeyPair1 : accessGroupKeyPair2;
    const dmThread = await getPaginatedDMThread({
      UserGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(
        activeUserKeyPair?.public as Uint8Array
      ),
      UserGroupKeyName: DEFAULT_KEY,
      PartyGroupOwnerPublicKeyBase58Check: publicKeyToBase58Check(
        otherUserKeyPair?.public as Uint8Array
      ),
      PartyGroupKeyName: DEFAULT_KEY,
      MaxMessagesToFetch: 100,
      StartTimeStamp: new Date().valueOf() * 1e6,
    });

    const threadMessages = await Promise.all(
      dmThread.ThreadMessages.map(async (message) => {
        const isSender =
          message.SenderInfo.OwnerPublicKeyBase58Check ===
          publicKeyToBase58Check(keyPair1?.public as Uint8Array);
        const publicDecryptionKey = isSender
          ? message.RecipientInfo.AccessGroupPublicKeyBase58Check
          : message.SenderInfo.AccessGroupPublicKeyBase58Check;
        const decryptedMessage = await decryptChatMessage(
          activeAccessGroupKeyPair?.seedHex as string,
          publicDecryptionKey,
          message.MessageInfo.EncryptedText
        );
        return {
          ...message,
          ...{ DecryptedMessage: decryptedMessage, IsSender: isSender },
        };
      })
    );
    setMessageThread(threadMessages);
  };

  const refreshBalances = async () => {
    if (!keyPair1 || !keyPair2) return;
    const { UserList } = await getUsersStateless({
      PublicKeysBase58Check: [
        publicKeyToBase58Check(keyPair1.public),
        publicKeyToBase58Check(keyPair2.public),
      ],
      SkipForLeaderboard: true,
      IncludeBalance: true,
    });
    (UserList || []).forEach((user) => {
      if (
        user.PublicKeyBase58Check === publicKeyToBase58Check(keyPair1.public)
      ) {
        setBalance1(user.BalanceNanos);
      }
      if (
        user.PublicKeyBase58Check === publicKeyToBase58Check(keyPair2.public)
      ) {
        setBalance2(user.BalanceNanos);
      }
    });
  };

  return keyPair1 && keyPair2 ? (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="position">
      <ScrollView style={styles.container}>
        <View style={styles.container}>
          <StyledCard title={"User 1 Public Key"}>
            <>
              <CopyToClipboard text={publicKeyToBase58Check(keyPair1.public)}>
                {publicKeyToBase58Check(keyPair1.public)}
              </CopyToClipboard>
              <Text style={styles.label}>Balance: {balance1 || 0} nanos</Text>
            </>
          </StyledCard>

          <StyledCard title={"User 2 Public Key"}>
            <>
              <CopyToClipboard text={publicKeyToBase58Check(keyPair2.public)}>
                {publicKeyToBase58Check(keyPair2.public)}
              </CopyToClipboard>
              <Text style={styles.label}>Balance: {balance2 || 0} nanos</Text>
            </>
          </StyledCard>

          <StyledButton
            text={"Refresh Balances"}
            onPress={async () => {
              await refreshBalances();
            }}
          />

          {!accessGroupKeyPair1 && !accessGroupKeyPair2 ? (
            <StyledButton
              text="Create Access Groups"
              onPress={async () => {
                const [accessGroup1Res, accessGroup2Res] = await Promise.all([
                  createAccessGroup(keyPair1, DEFAULT_KEY),
                  createAccessGroup(keyPair2, DEFAULT_KEY)
                ]);
                console.log(accessGroup1Res, accessGroup2Res);
                setAccessGroupKeyPair1(accessGroup1Res.accessGroupKeyPair);
                setAccessGroupKeyPair2(accessGroup2Res.accessGroupKeyPair);
              }}
            />
          ) : (
            <View style={{ marginTop: 24 }}>
              <StyledCard>
                <StyledInput placeholder={'User 1 message'} value={message1} onChangeText={(text) => setMessage1(text)} />
                <StyledButton
                  text="Send message from user1"
                  onPress={() =>
                    sendMessage(
                      keyPair1,
                      accessGroupKeyPair1 as KeyPair,
                      DEFAULT_KEY,
                      publicKeyToBase58Check(keyPair2.public),
                      publicKeyToBase58Check(
                        accessGroupKeyPair2?.public as Uint8Array
                      ),
                      DEFAULT_KEY,
                      message1
                    )
                  }
                  styles={{ marginTop: 0 }}
                />
              </StyledCard>

              <StyledCard>
                <StyledInput placeholder={'User 2 message'} value={message2} onChangeText={(text) => setMessage2(text)} />
                <StyledButton
                  text="Send message from user2"
                  onPress={() =>
                    sendMessage(
                      keyPair2,
                      accessGroupKeyPair2 as KeyPair,
                      DEFAULT_KEY,
                      publicKeyToBase58Check(keyPair1.public),
                      publicKeyToBase58Check(
                        accessGroupKeyPair1?.public as Uint8Array
                      ),
                      DEFAULT_KEY,
                      message2
                    )
                  }
                  styles={{ marginTop: 0 }}
                />
              </StyledCard>

              <View style={{ marginBottom: 64 }}>
                <View style={{ marginTop: 32  }}>
                  <StyledCard title={'Message Thread'}>
                    <StyledButton
                      text="Refresh messages"
                      onPress={() => getMessageThread()}
                      styles={{ backgroundColor: "#009688", marginTop: 6, marginBottom: 12 }}
                    />

                    {messageThread.length === 0 && <Text>No messages found.</Text>}

                    {messageThread.map((message) => {
                      return (
                        <View key={message.MessageInfo.TstampNanos}>
                          <StyledMessage
                            key={message.MessageInfo.TimestampNanos}
                            text={message.DecryptedMessage}
                            sender={message.SenderInfo.OwnerPublicKeyBase58Check}
                            timestampNanos={message.MessageInfo.TimestampNanos}
                            isSelf={true} // TODO: always true because we don't have radio button to select a user
                          />
                        </View>
                      );
                    })}
                  </StyledCard>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <View style={{ display: "flex", alignItems: "center" }}>
      <StyledButton
        text="Generate Key Pairs"
        onPress={() => {
          setKeyPair1(keygen());
          setKeyPair2(keygen());
        }}
        styles={{ width: "80%" }}
      />
    </View>
  );
}
