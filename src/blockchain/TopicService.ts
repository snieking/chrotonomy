import { BLOCKCHAIN, GTX } from "./Postchain";
import { seedToKey } from "./CryptoService";
import { uniqueId } from "../util/util";
import * as BoomerangCache from "boomerang-cache";
import { Topic, TopicReply, User } from "../types";
import { sendNotifications } from "./NotificationService";

const topicsCache = BoomerangCache.create("topic-bucket", {
  storage: "session",
  encrypt: false
});

export function createTopic(
  user: User,
  channelName: string,
  title: string,
  message: string
) {
  const { privKey, pubKey } = seedToKey(user.seed);
  const topicId = uniqueId();

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation(
    "create_topic",
    topicId,
    user.name.toLocaleLowerCase(),
    channelName.toLocaleLowerCase(),
    channelName,
    title,
    message
  );
  tx.sign(privKey, pubKey);

  return tx.postAndWaitConfirmation().then((promise: unknown) => {
    subscribeToTopic(user, topicId);
    return promise;
  });
}

export function modifyTopic(user: User, topicId: string, updatedText: string) {
  topicsCache.remove(topicId);
  return modifyText(user, topicId, updatedText, "modify_topic");
}

export function modifyReply(user: User, replyId: string, updatedText: string) {
  return modifyText(user, replyId, updatedText, "modify_reply");
}

function modifyText(
  user: User,
  id: string,
  updatedText: string,
  rellOperation: string
) {
  const { privKey, pubKey } = seedToKey(user.seed);

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation(
    rellOperation,
    id,
    user.name.toLocaleLowerCase(),
    updatedText
  );
  tx.sign(privKey, pubKey);

  return tx.postAndWaitConfirmation();
}

export function createTopicReply(user: User, topicId: string, message: string) {
  const { privKey, pubKey } = seedToKey(user.seed);
  const replyId = uniqueId();

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation(
    "create_reply",
    topicId,
    replyId,
    user.name.toLocaleLowerCase(),
    message
  );
  tx.sign(privKey, pubKey);

  return postTopicReply(user, tx, topicId, message, replyId);
}

export function createTopicSubReply(
  user: User,
  topicId: string,
  replyId: string,
  message: string
) {
  const { privKey, pubKey } = seedToKey(user.seed);
  const subReplyId = uniqueId();

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation(
    "create_sub_reply",
    topicId,
    replyId,
    subReplyId,
    user.name.toLocaleLowerCase(),
    message
  );
  tx.sign(privKey, pubKey);
  return postTopicReply(user, tx, topicId, message, subReplyId);
}

function postTopicReply(
  user: User,
  tx: any,
  topicId: string,
  message: string,
  replyId: string
) {
  return tx.postAndWaitConfirmation().then((promise: unknown) => {
    getTopicSubscribers(topicId).then(users =>
      sendNotifications(
        user,
        createReplyTriggerString(user.name, topicId),
        message,
        users
          .map(name => name.toLocaleLowerCase())
          .filter(item => item !== user.name)
      )
    );
    return promise;
  });
}

function createReplyTriggerString(name: string, id: string): string {
  return "@" + name + " replied to /t/" + id;
}

export function removeTopic(user: User, topicId: string) {
  topicsCache.remove(topicId);
  const { privKey, pubKey } = seedToKey(user.seed);

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation("remove_topic", user.name.toLocaleLowerCase(), topicId);
  tx.sign(privKey, pubKey);
  return tx.postAndWaitConfirmation();
}

export function removeTopicReply(user: User, topicReplyId: string) {
  const { privKey, pubKey } = seedToKey(user.seed);

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation(
    "remove_topic_reply",
    user.name.toLocaleLowerCase(),
    topicReplyId
  );
  tx.sign(privKey, pubKey);
  return tx.postAndWaitConfirmation();
}

export function getTopicRepliesPriorToTimestamp(
  topicId: string,
  timestamp: number,
  pageSize: number
): Promise<TopicReply[]> {
  return getTopicRepliesForTimestamp(
    topicId,
    timestamp,
    pageSize,
    "get_topic_replies_prior_to_timestamp"
  );
}

export function getTopicRepliesAfterTimestamp(
  topicId: string,
  timestamp: number,
  pageSize: number
): Promise<TopicReply[]> {
  return getTopicRepliesForTimestamp(
    topicId,
    timestamp,
    pageSize,
    "get_topic_replies_after_timestamp"
  );
}

function getTopicRepliesForTimestamp(
  topicId: string,
  timestamp: number,
  pageSize: number,
  rellOperation: string
) {
  return BLOCKCHAIN.then(bc =>
    bc.query(rellOperation, {
      topic_id: topicId,
      timestamp: timestamp,
      page_size: pageSize
    })
  );
}

export function getTopicRepliesByUserPriorToTimestamp(
  name: string,
  timestamp: number,
  pageSize: number
): Promise<TopicReply[]> {
  return GTX.query("get_topic_replies_by_user_prior_to_timestamp", {
    name: name.toLocaleLowerCase(),
    timestamp: timestamp,
    page_size: pageSize
  });
}

export function getTopicSubReplies(replyId: string): Promise<TopicReply[]> {
  return GTX.query("get_sub_replies", { parent_reply_id: replyId });
}

export function getTopicsByUserPriorToTimestamp(
  username: string,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return GTX.query("get_topics_by_user_id_prior_to_timestamp", {
    name: username.toLocaleLowerCase(),
    timestamp: timestamp,
    page_size: pageSize
  }).then((topics: Topic[]) => {
    topics.forEach(topic => topicsCache.set(topic.id, topic));
    return topics;
  });
}

export function getTopicsByChannelPriorToTimestamp(
  channelName: string,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return GTX.query("get_topics_by_channel_prior_to_timestamp", {
    name: channelName.toLocaleLowerCase(),
    timestamp: timestamp,
    page_size: pageSize
  }).then((topics: Topic[]) => {
    topics.forEach(topic => topicsCache.set(topic.id, topic));
    return topics;
  });
}

export function getTopicsByChannelAfterTimestamp(
  channelName: string,
  timestamp: number
): Promise<Topic[]> {
  return GTX.query("get_topics_by_channel_after_timestamp", {
    name: channelName.toLocaleLowerCase(),
    timestamp: timestamp
  }).then((topics: Topic[]) => {
    topics.forEach(topic => topicsCache.set(topic.id, topic));
    return topics;
  });
}

export function countTopicsInChannel(channelName: string): Promise<number> {
  return GTX.query("count_topics_by_channel", {
    name: channelName.toLocaleLowerCase()
  });
}

export function giveTopicStarRating(user: User, topicId: string) {
  console.log("User: ", user);
  return modifyRatingAndSubscription(user, topicId, "give_topic_star_rating");
}

export function removeTopicStarRating(user: User, topicId: string) {
  return modifyRatingAndSubscription(user, topicId, "remove_topic_star_rating");
}

export function getTopicStarRaters(topicId: string): Promise<string[]> {
  return GTX.query("get_star_rating_for_topic", { id: topicId });
}

export function giveReplyStarRating(user: User, replyId: string) {
  return modifyRatingAndSubscription(user, replyId, "give_reply_star_rating");
}

export function removeReplyStarRating(user: User, replyId: string) {
  return modifyRatingAndSubscription(user, replyId, "remove_reply_star_rating");
}

export function subscribeToTopic(user: User, id: string) {
  return modifyRatingAndSubscription(user, id, "subscribe_to_topic");
}

export function unsubscribeFromTopic(user: User, id: string) {
  return modifyRatingAndSubscription(user, id, "unsubscribe_from_topic");
}

function modifyRatingAndSubscription(
  user: User,
  id: string,
  rellOperation: string
) {
  const { privKey, pubKey } = seedToKey(user.seed);

  const tx = GTX.newTransaction([pubKey]);
  tx.addOperation(rellOperation, user.name.toLocaleLowerCase(), id);
  tx.addOperation("nop", uniqueId());
  tx.sign(privKey, pubKey);
  return tx.postAndWaitConfirmation();
}

export function getReplyStarRaters(topicId: string): Promise<string[]> {
  return GTX.query("get_star_rating_for_reply", { id: topicId });
}

export function getTopicSubscribers(topicId: string): Promise<string[]> {
  return GTX.query("get_subscribers_for_topic", { id: topicId });
}

export function getTopicById(id: string): Promise<Topic> {
  const cachedTopic: Topic = topicsCache.get(id);

  if (cachedTopic != null) {
    return new Promise<Topic>(resolve => resolve(cachedTopic));
  }

  return GTX.query("get_topic_by_id", { id: id }).then((topic: Topic) => {
    topicsCache.set(id, topic, 300);
    return topic;
  });
}

export function getTopicsPriorToTimestamp(
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsForTimestamp(
    timestamp,
    pageSize,
    "get_topics_prior_to_timestamp"
  );
}

export function getTopicsAfterTimestamp(
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsForTimestamp(
    timestamp,
    pageSize,
    "get_topics_after_timestamp"
  );
}

function getTopicsForTimestamp(
  timestamp: number,
  pageSize: number,
  rellOperation: string
): Promise<Topic[]> {
  return GTX.query(rellOperation, {
    timestamp: timestamp,
    page_size: pageSize
  }).then((topics: Topic[]) => {
    topics.forEach(topic => topicsCache.set(topic.id, topic));
    return topics;
  });
}

export function getTopicsFromFollowsAfterTimestamp(
  user: User,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsFromFollowsForTimestamp(
    user,
    timestamp,
    pageSize,
    "get_topics_from_follows_after_timestamp"
  );
}

export function getTopicsFromFollowsPriorToTimestamp(
  user: User,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsFromFollowsForTimestamp(
    user,
    timestamp,
    pageSize,
    "get_topics_from_follows_prior_to_timestamp"
  );
}

function getTopicsFromFollowsForTimestamp(
  user: User,
  timestamp: number,
  pageSize: number,
  rellOperation: string
): Promise<Topic[]> {
  return GTX.query(rellOperation, {
    name: user.name.toLocaleLowerCase(),
    timestamp: timestamp,
    page_size: pageSize
  });
}

export function countTopicsByUser(name: string) {
  return countByUser(name, "count_topics_by_user");
}

export function countRepliesByUser(name: string) {
  return countByUser(name, "count_replies_by_user");
}

export function countTopicStarRatingForUser(name: string) {
  return countByUser(name, "count_user_topic_star_rating");
}

export function countReplyStarRatingForUser(name: string) {
  return countByUser(name, "count_user_reply_star_rating");
}

function countByUser(name: string, rellOperation: string): Promise<number> {
  return GTX.query(rellOperation, { name: name.toLocaleLowerCase() });
}

export function getTopicsFromFollowedChannelsPriorToTimestamp(
  user: User,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return GTX.query("get_topics_by_followed_channels_prior_to_timestamp", {
    username: user.name.toLocaleLowerCase(),
    timestamp: timestamp,
    page_size: pageSize
  }).then((topics: Topic[]) => {
    var seen: Set<string> = new Set<string>();
    return topics.filter(item => {
      let k = item.id;
      return seen.has(k) ? false : seen.add(k);
    });
  });
}

export function getAllTopicsByPopularityAfterTimestamp(
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return GTX.query("get_all_topics_by_stars_since_timestamp", {
    timestamp: timestamp,
    page_size: pageSize
  });
}

export function getTopicsByFollowsSortedByPopularityAfterTimestamp(
  name: string,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsByPopularityAfterTimestamp(
    name,
    timestamp,
    pageSize,
    "get_topics_by_follows_and_stars_since_timestamp"
  );
}

export function getTopicsByFollowedChannelSortedByPopularityAfterTimestamp(
  name: string,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsByPopularityAfterTimestamp(
    name,
    timestamp,
    pageSize,
    "get_topics_by_followed_channels_after_timestamp_sorted_by_popularity"
  );
}

export function getTopicsByChannelSortedByPopularityAfterTimestamp(
  name: string,
  timestamp: number,
  pageSize: number
): Promise<Topic[]> {
  return getTopicsByPopularityAfterTimestamp(
    name.toLocaleLowerCase(),
    timestamp,
    pageSize,
    "get_topics_by_channel_after_timestamp_sorted_by_popularity"
  );
}

function getTopicsByPopularityAfterTimestamp(
  name: string,
  timestamp: number,
  pageSize: number,
  rellOperation: string
): Promise<Topic[]> {
  return GTX.query(rellOperation, {
    name: name.toLocaleLowerCase(),
    timestamp: timestamp,
    page_size: pageSize
  });
}
