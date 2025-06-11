import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { ScrollView, YStack } from 'tamagui';
import { AIRecommend } from '~/components/ai-recommendation';
import { useGetRecommendation } from '~/hooks/api';
import { SVGCup, SVGFlower, SVGRun } from '~/icons';

const AiRecomendation = () => {
  const { log_id } = useLocalSearchParams();
  const aiRecomend = useGetRecommendation(Number(log_id));
  if (aiRecomend.isLoading) return <ActivityIndicator />;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      backgroundColor={'white'}
      refreshControl={
        <RefreshControl refreshing={aiRecomend.isRefetching} onRefresh={aiRecomend.refetch} />
      }>
      <YStack flex={1}>
        <AIRecommend
          headerText="Diet"
          title={'Balanced Nutrition'}
          icon={<SVGCup />}
          content={aiRecomend.data?.recommendation.diet}
        />
        <AIRecommend
          headerText="Exercise"
          title={'Regular Physical Activity'}
          icon={<SVGRun />}
          content={aiRecomend.data?.recommendation.exercise}
        />
        <AIRecommend
          headerText="Wellness"
          title={'Stress Management'}
          icon={<SVGFlower />}
          content={aiRecomend.data?.recommendation.wellness}
        />
      </YStack>
    </ScrollView>
  );
};

export default AiRecomendation;
