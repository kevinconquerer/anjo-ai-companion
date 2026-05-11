import { forwardRef, useCallback } from 'react';
import { FlatList } from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';
import { DisplayMessage } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: DisplayMessage[];
  orbTrust: number;
  orbValence: number;
  orbArousal: number;
  orbLonging: number;
  paddingTop: number;
  paddingBottom: number;
  onContentSizeChange: () => void;
}

export const MessageList = forwardRef<FlatList<DisplayMessage>, MessageListProps>(function MessageList(
  { messages, orbTrust, orbValence, orbArousal, orbLonging, paddingTop, paddingBottom, onContentSizeChange },
  ref,
) {
  const renderItem = useCallback(
    ({ item }: { item: DisplayMessage }) => (
      <MessageItem
        message={item}
        orbTrust={orbTrust}
        orbValence={orbValence}
        orbArousal={orbArousal}
        orbLonging={orbLonging}
      />
    ),
    [orbTrust, orbValence, orbArousal, orbLonging],
  );

  return (
    <Reanimated.FlatList
      ref={ref}
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 16,
        paddingTop,
        paddingBottom,
      }}
      onContentSizeChange={onContentSizeChange}
      itemLayoutAnimation={LinearTransition}
      keyboardDismissMode="interactive"
    />
  );
});
