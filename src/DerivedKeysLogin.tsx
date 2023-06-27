import {
  AccessGroupEntryResponse,
  checkPartyAccessGroups,
  createAccessGroup,
  getAccessGroupInfo,
  getPaginatedDMThread,
  getUsersStateless,
  identity,
  keygen,
  KeyPair,
  publicKeyToBase58Check,
  sendMessage
} from "deso-protocol";
import { Text, StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView } from "react-native";
import { useEffect, useState } from "react";
import { IdentityDerivePayload } from "deso-protocol/src/identity/types";
import StyledButton from "./Shared/StyledButton";
import StyledCard from "./Shared/StyledCard";
import StyledRadio from "./Shared/StyledRadio";
import StyledInput from "./Shared/StyledInput";
import StyledMessage from "./Shared/StyledMessage";
import CopyToClipboard from "./Shared/CopyToClipboard";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F2F2",
    padding: 20
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4
  },
  value: {
    fontSize: 16,
    marginBottom: 4,
    color: "#666666"
  },
  radioRow: {
    flexDirection: "row",
    marginBottom: 16,
    marginTop: 16
  },
  sendMessagesCard: {
    marginTop: 32
  }
});

export const DEFAULT_KEY = "default-key";
export const NETWORK = "testnet";

export default function DerivedKeysLogin() {
  const [keyPair1, setKeyPair1] = useState<KeyPair | null>(null);
  const [keyPair2, setKeyPair2] = useState<KeyPair | null>(null);
  const [user1, setUser1] = useState<IdentityDerivePayload | null>(null);
  const [user2, setUser2] = useState<IdentityDerivePayload | null>(null);
  const [balance1, setBalance1] = useState<number>(0);
  const [balance2, setBalance2] = useState<number>(0);
  const [user1AccessGroup, setUser1AccessGroup] = useState<null | AccessGroupEntryResponse>(null);
  const [user2AccessGroup, setUser2AccessGroup] = useState<null | AccessGroupEntryResponse>(null);
  const [messageThread, setMessageThread] = useState<any[]>([]);

  const [radioSelected, setRadioSelected] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [accessGroupsReady, setAccessGroupsReady] = useState<boolean>(false);
  const [refreshingBalance, setRefreshingBalance] = useState<boolean>(false);
  const [creatingAccessGroups, setCreatingAccessGroups] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  useEffect(() => {
    setKeyPair1(keygen());
    setKeyPair2(keygen());
  }, []);

  const getUserKey = (keypair: KeyPair) => {
    return publicKeyToBase58Check(keypair.public, { network: NETWORK });
  }

  const loginWithSeedHex = async (pair1: KeyPair, pair2: KeyPair) => {
    const user1Response = await identity.loginWithAutoDerive(pair1.seedHex);
    setUser1(user1Response);

    const user2Response = await identity.loginWithAutoDerive(pair2.seedHex);
    setUser2(user2Response);

    return Promise.resolve([user1Response, user2Response]);
  };

  const refreshBalances = async () => {
    if (!keyPair1 || !keyPair2) {
      return;
    }

    setRefreshingBalance(true);

    try {
      const user1PublicKey = getUserKey(keyPair1);
      const user2PublicKey = getUserKey(keyPair2);

      const { UserList } = await getUsersStateless({
        PublicKeysBase58Check: [
          user1PublicKey,
          user2PublicKey
        ],
        SkipForLeaderboard: true,
        IncludeBalance: true
      });

      setBalance1(UserList?.[0].BalanceNanos || 0);
      setBalance2(UserList?.[1].BalanceNanos || 0);

      await checkPartyAccessGroups({
        SenderPublicKeyBase58Check: user1PublicKey,
        SenderAccessGroupKeyName: DEFAULT_KEY,
        RecipientPublicKeyBase58Check: user2PublicKey,
        RecipientAccessGroupKeyName: DEFAULT_KEY
      })
        .then((res) => {
          if (res.IsSenderAccessGroupKey && res.IsRecipientAccessGroupKey) {
            // TODO: request access groups here
            setAccessGroupsReady(true);
          } else {
            // TODO: check if this flow works
            setAccessGroupsReady(false);
          }
        });
    } catch (e) {
      Alert.alert("An error happened", JSON.stringify(e));
    } finally {
      setRefreshingBalance(false);
    }
  };

  const newAccessGroup = async (user: IdentityDerivePayload, groupName = DEFAULT_KEY) => {
    await identity.setActiveUser(user.publicKeyBase58Check);

    await createAccessGroup({
      AccessGroupKeyName: groupName,
      AccessGroupOwnerPublicKeyBase58Check: user.publicKeyBase58Check,
      AccessGroupPublicKeyBase58Check: user.messagingPublicKeyBase58Check,
      MinFeeRateNanosPerKB: 1000
    });

    return getAccessGroupInfo({
      AccessGroupKeyName: DEFAULT_KEY,
      AccessGroupOwnerPublicKeyBase58Check: user.publicKeyBase58Check,
    });
  };

  const sendNewMessage = async (
    messageToSend: string,
    senderPublicKeyBase58Check: string,
    RecipientPublicKeyBase58Check: string
  ): Promise<any> => {
    if (!user1 || !user2) {
      return;
    }

    setSendingMessage(true);

    try {
      await identity.setActiveUser(senderPublicKeyBase58Check);

      await sendMessage({
        SenderPublicKeyBase58Check: senderPublicKeyBase58Check,
        RecipientPublicKeyBase58Check: RecipientPublicKeyBase58Check,
        Message: messageToSend,
        AccessGroup: DEFAULT_KEY
      });

      await getDMThread(user1.publicKeyBase58Check, user2.publicKeyBase58Check);

      setMessage("");
    } catch (e) {
      Alert.alert("An error happened", JSON.stringify(e));
    } finally {
      setSendingMessage(false);
    }
  };

  const getDMThread = async (user1PublicKey: string, user2PublicKey: string) => {
    if (!user1PublicKey || !user2PublicKey || !user1AccessGroup || !user2AccessGroup) {
      return;
    }

    const { ThreadMessages } = await getPaginatedDMThread({
      UserGroupOwnerPublicKeyBase58Check: user1PublicKey,
      UserGroupKeyName: DEFAULT_KEY,
      PartyGroupOwnerPublicKeyBase58Check: user2PublicKey,
      PartyGroupKeyName: DEFAULT_KEY,
      MaxMessagesToFetch: 50,
      StartTimeStamp: new Date().valueOf() * 1e6
    });

    const decryptedThread = await Promise.all(ThreadMessages.map(msg => {
      return identity.decryptMessage(msg, [user1AccessGroup, user2AccessGroup]);
    }));

    setMessageThread(decryptedThread);
  };

  const handleRadioPress = (radioValue: number) => {
    setRadioSelected(radioValue);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="position">
      <ScrollView style={styles.container}>
        {
          keyPair1 && keyPair2 && (
            <View>
              <StyledCard title={"User 1 Public Key"}>
                <>
                  <CopyToClipboard text={getUserKey(keyPair1)}>
                    {getUserKey(keyPair1)}
                  </CopyToClipboard>
                  <Text style={styles.label}>Balance: {balance1} nanos</Text>
                </>
              </StyledCard>

              <StyledCard title={"User 2 Public Key"}>
                <>
                  <CopyToClipboard text={getUserKey(keyPair2)}>
                    {getUserKey(keyPair2)}
                  </CopyToClipboard>
                  <Text style={styles.label}>Balance: {balance2} nanos</Text>
                </>
              </StyledCard>

              <StyledButton
                text={"Refresh Balances"}
                loading={refreshingBalance}
                onPress={async () => {
                  await refreshBalances();
                }}
              />

              {!accessGroupsReady && (
                <StyledButton
                  text={"Create access group"}
                  loading={creatingAccessGroups}
                  disabled={balance1 === 0 || balance2 === 0}
                  onPress={async () => {
                    setCreatingAccessGroups(true);

                    try {
                      const [usr1, usr2] = await loginWithSeedHex(keyPair1, keyPair2);

                      const accessGroup1 = await newAccessGroup(usr1);
                      setUser1AccessGroup(accessGroup1);

                      const accessGroup2 = await newAccessGroup(usr2);
                      setUser2AccessGroup(accessGroup2);

                      setAccessGroupsReady(true);
                    } catch (e) {
                      Alert.alert("An error happened", JSON.stringify(e));
                    } finally {
                      setCreatingAccessGroups(false);
                    }
                  }}
                />
              )}

              {
                accessGroupsReady && (
                  <View style={styles.sendMessagesCard}>
                    <StyledCard title="Send messages">
                      <View style={styles.radioRow}>
                        <StyledRadio
                          label="User 1"
                          selected={radioSelected === 1}
                          onPress={() => handleRadioPress(1)}
                        />
                        <StyledRadio
                          label="User 2"
                          selected={radioSelected === 2}
                          onPress={() => handleRadioPress(2)}
                        />
                      </View>

                      <View>
                        <StyledInput
                          placeholder="Enter your message"
                          value={message}
                          onChangeText={setMessage}
                        />

                        <StyledButton
                          text={"Send message"}
                          loading={sendingMessage}
                          onPress={async () => {
                            const senderUser = radioSelected === 1 ? user1 : user2;
                            const receiverUser = radioSelected === 1 ? user2 : user1;

                            if (!senderUser || !receiverUser) {
                              return;
                            }

                            await sendNewMessage(
                              message,
                              senderUser.publicKeyBase58Check,
                              receiverUser.publicKeyBase58Check
                            );
                          }}
                        />
                      </View>
                    </StyledCard>

                    <View style={{ marginBottom: 64}}>
                      <StyledCard title={"Thread"}>
                        {messageThread.length === 0 && <Text>No messages found.</Text>}

                        {messageThread.map((message, i) => {
                          const activeUserKey = (radioSelected === 1) ? user1?.publicKeyBase58Check : user2?.publicKeyBase58Check;
                          const isSelf = message.SenderInfo.OwnerPublicKeyBase58Check === activeUserKey;

                          return (
                            <StyledMessage
                              key={message.MessageInfo.TimestampNanos}
                              text={message.DecryptedMessage}
                              sender={message.SenderInfo.OwnerPublicKeyBase58Check}
                              timestampNanos={message.MessageInfo.TimestampNanos}
                              isSelf={isSelf}
                            />
                          );
                        })}
                      </StyledCard>
                    </View>
                  </View>
                )
              }
            </View>
          )
        }
      </ScrollView>
    </KeyboardAvoidingView>
  );
}