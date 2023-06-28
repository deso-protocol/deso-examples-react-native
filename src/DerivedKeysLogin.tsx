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
  /*
   If you have a seed hexes you'd like to test with, you can put them directly into the constants below.
   If you leave them empty, the new keypair will be generated.
   */
  const SEED_HEX_1 = "";
  const SEED_HEX_2 = "";

  // Keypair that will be generated using `keygen` function from the provided seed hex, or will generate new keys
  const [keyPair1, setKeyPair1] = useState<KeyPair | null>(null);
  const [keyPair2, setKeyPair2] = useState<KeyPair | null>(null);

  // User objects that are retrieved after login
  const [user1, setUser1] = useState<IdentityDerivePayload | null>(null);
  const [user2, setUser2] = useState<IdentityDerivePayload | null>(null);

  // User balances, should be positive to start chatting
  const [balance1, setBalance1] = useState<number>(0);
  const [balance2, setBalance2] = useState<number>(0);

  // User access group with the name 'default-key'
  const [user1AccessGroup, setUser1AccessGroup] =
    useState<null | AccessGroupEntryResponse>(null);
  const [user2AccessGroup, setUser2AccessGroup] =
    useState<null | AccessGroupEntryResponse>(null);

  // Thread of messages
  const [messageThread, setMessageThread] = useState<any[]>([]);

  // Component state
  const [radioSelected, setRadioSelected] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [accessGroupsReady, setAccessGroupsReady] = useState<boolean>(false);
  const [refreshingBalance, setRefreshingBalance] = useState<boolean>(false);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  useEffect(() => {
    const keyPair1 = keygen(SEED_HEX_1);
    const keyPair2 = keygen(SEED_HEX_2);

    setKeyPair1(keyPair1);
    setKeyPair2(keyPair2);

    if (SEED_HEX_1 || SEED_HEX_2) {
      // If a seed hex is provided, we fetch the balance immediately
      refreshBalances(keyPair1, keyPair2);
    }
  }, []);

  useEffect(() => {
    if (!user1 || !user2) {
      return;
    }

    if (accessGroupsReady) {
      // When access groups are getting ready, we fetch the chat history if any
      getDMThread(user1.publicKeyBase58Check, user2.publicKeyBase58Check);
    }
  }, [accessGroupsReady]);

  const getUserKey = (keypair: KeyPair) => {
    return publicKeyToBase58Check(keypair.public, { network: NETWORK });
  };

  const loginWithSeedHex = async (pair1: KeyPair, pair2: KeyPair) => {
    /*
    The provided seed hex is sent to the new method on idetity called `loginWithAutoDerive`.
    This method accepts a seedHex and goes through the login flow.
    After user is logged in (and promise is resolved), the user keys are stored in the localStorage.
   */
    const user1Response = await identity.loginWithAutoDerive(pair1.seedHex);
    setUser1(user1Response);

    const user2Response = await identity.loginWithAutoDerive(pair2.seedHex);
    setUser2(user2Response);

    return Promise.resolve([user1Response, user2Response]);
  };

  const refreshBalances = async (pair1 = keyPair1, pair2 = keyPair2) => {
    if (!pair1 || !pair2) {
      return;
    }

    setRefreshingBalance(true);

    try {
      const user1PublicKey = getUserKey(pair1);
      const user2PublicKey = getUserKey(pair2);

      const { UserList } = await getUsersStateless({
        PublicKeysBase58Check: [user1PublicKey, user2PublicKey],
        SkipForLeaderboard: true,
        IncludeBalance: true,
      });

      const user1Balance = UserList?.[0].BalanceNanos || 0;
      const user2Balance = UserList?.[1].BalanceNanos || 0;

      setBalance1(user1Balance || 0);
      setBalance2(user2Balance || 0);

      if (user1Balance > 0 && user2Balance > 0 && !accessGroupsReady) {
        // When users have some positive balance, we try to check if they already have 'default-key' access groups.
        const res = await checkPartyAccessGroups({
          SenderPublicKeyBase58Check: user1PublicKey,
          SenderAccessGroupKeyName: DEFAULT_KEY,
          RecipientPublicKeyBase58Check: user2PublicKey,
          RecipientAccessGroupKeyName: DEFAULT_KEY,
        });

        let accessGroup1;
        let accessGroup2;

        if (res.IsSenderAccessGroupKey) {
          accessGroup1 = {
            AccessGroupKeyName: DEFAULT_KEY,
            AccessGroupMemberEntryResponse: null,
            AccessGroupPublicKeyBase58Check:
            res.SenderAccessGroupPublicKeyBase58Check,
            AccessGroupOwnerPublicKeyBase58Check:
            res.SenderPublicKeyBase58Check,
          };
        }

        if (res.IsRecipientAccessGroupKey) {
          accessGroup2 = {
            AccessGroupKeyName: DEFAULT_KEY,
            AccessGroupMemberEntryResponse: null,
            AccessGroupPublicKeyBase58Check:
            res.RecipientAccessGroupPublicKeyBase58Check,
            AccessGroupOwnerPublicKeyBase58Check:
            res.RecipientPublicKeyBase58Check,
          };
        }

        await startChat(pair1, pair2, accessGroup1, accessGroup2);
      }
    } catch (e) {
      Alert.alert("An error happened", JSON.stringify(e));
    } finally {
      setRefreshingBalance(false);
    }
  };

  const startChat = async (
    pair1 = keyPair1,
    pair2 = keyPair2,
    accessGroup1 = user1AccessGroup,
    accessGroup2 = user2AccessGroup
  ) => {
    if (!pair1 || !pair2) {
      return;
    }

    setLoggingIn(true);

    try {
      const [usr1, usr2] = await loginWithSeedHex(pair1, pair2);

      setUser1AccessGroup(accessGroup1 || (await newAccessGroup(usr1)));
      setUser2AccessGroup(accessGroup2 || (await newAccessGroup(usr2)));

      setAccessGroupsReady(true);
    } catch (e) {
      Alert.alert("An error happened", JSON.stringify(e));
    } finally {
      setLoggingIn(false);
    }
  };

  const newAccessGroup = async (
    user: IdentityDerivePayload,
    groupName = DEFAULT_KEY
  ) => {
    await identity.setActiveUser(user.publicKeyBase58Check);

    // Check if user already has default access group and returning it if that's true
    const res = await getAccessGroupInfo({
      AccessGroupKeyName: DEFAULT_KEY,
      AccessGroupOwnerPublicKeyBase58Check: user.publicKeyBase58Check,
    })
      .catch(() => Promise.resolve(null));

    if (res) {
      return Promise.resolve(res);
    }

    await createAccessGroup({
      AccessGroupKeyName: groupName,
      AccessGroupOwnerPublicKeyBase58Check: user.publicKeyBase58Check,
      AccessGroupPublicKeyBase58Check: user.messagingPublicKeyBase58Check,
      MinFeeRateNanosPerKB: 1000,
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
        AccessGroup: DEFAULT_KEY,
      });

      await getDMThread(user1.publicKeyBase58Check, user2.publicKeyBase58Check);

      setMessage("");
    } catch (e) {
      Alert.alert("An error happened", JSON.stringify(e));
    } finally {
      setSendingMessage(false);
    }
  };

  const getDMThread = async (
    user1PublicKey: string,
    user2PublicKey: string
  ) => {
    if (
      !user1PublicKey ||
      !user2PublicKey ||
      !user1AccessGroup ||
      !user2AccessGroup
    ) {
      return;
    }

    const { ThreadMessages } = await getPaginatedDMThread({
      UserGroupOwnerPublicKeyBase58Check: user1PublicKey,
      UserGroupKeyName: DEFAULT_KEY,
      PartyGroupOwnerPublicKeyBase58Check: user2PublicKey,
      PartyGroupKeyName: DEFAULT_KEY,
      MaxMessagesToFetch: 50,
      StartTimeStamp: new Date().valueOf() * 1e6,
    });

    const decryptedThread = await Promise.all(
      ThreadMessages.map((msg) => {
        const activeAccessGroup = (radioSelected === 1) ? user1AccessGroup : user2AccessGroup;
        return identity.decryptMessage(msg, [activeAccessGroup]);
      })
    );

    setMessageThread(decryptedThread);
  };

  const handleRadioPress = (radioValue: number) => {
    setRadioSelected(radioValue);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="position">
      <ScrollView style={styles.container}>
        {keyPair1 && keyPair2 && (
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
              loading={refreshingBalance || loggingIn}
              onPress={async () => {
                await refreshBalances();
              }}
            />

            {accessGroupsReady && (
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
                        const receiverUser =
                          radioSelected === 1 ? user2 : user1;

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

                <View style={{ marginBottom: 64 }}>
                  <StyledCard title={"Thread"}>
                    {messageThread.length === 0 && (
                      <Text>No messages found.</Text>
                    )}

                    {messageThread.map((message, i) => {
                      const activeUserKey =
                        radioSelected === 1
                          ? user1?.publicKeyBase58Check
                          : user2?.publicKeyBase58Check;
                      const isSelf =
                        message.SenderInfo.OwnerPublicKeyBase58Check ===
                        activeUserKey;

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
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
