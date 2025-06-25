import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { HTTPError } from 'ky';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform } from 'react-native';
import {
  Form,
  Input,
  ScrollView,
  SizableText,
  Slider,
  Spinner,
  TextArea,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { Toast } from 'toastify-react-native';
import { z } from 'zod';
import { Button } from '~/components/button';
import { CheckboxWithLabel } from '~/components/checkbox';
import { useCreateUserSymptoms } from '~/hooks/api';
import { useAuthStore } from '~/store/store';
import { decodeJwt } from '~/utils';

const symptomsSchema = z.object({
  fatigue: z
    .boolean()
    .transform((x) => (x ? 'Fatigue' : ''))
    .optional(),
  cramps: z
    .boolean()
    .transform((x) => (x ? 'Cramps' : ''))
    .optional(),
  headache: z
    .boolean()
    .transform((x) => (x ? 'Headache' : ''))
    .optional(),
  nausea: z
    .boolean()
    .transform((x) => (x ? 'Nausea' : ''))
    .optional(),
  bloating: z
    .boolean()
    .transform((x) => (x ? 'Bloating' : ''))
    .optional(),
  painLevel: z.array(z.number()),
  mood: z
    .string({
      required_error: 'Mood is required',
    })
    .min(1, 'Mood is required'),
  cycleDay: z.coerce
    .number({
      invalid_type_error: 'Cycle Day must be a number',
      required_error: 'Cycle Day is required',
    })
    .refine((value) => value >= 1 && value <= 31, {
      message: 'Cycle Day must be between 1 and 31',
    }),
  notes: z.string().optional(),
});

const Track = () => {
  const form = useForm({
    resolver: zodResolver(symptomsSchema),
    defaultValues: {
      fatigue: false,
      cramps: false,
      bloating: false,
      nausea: false,
      headache: false,
      notes: '',
    },
  });
  const navigate = useRouter();
  const user = useAuthStore();
  const user_id = decodeJwt(user.user?.token)?.user_id || 0;
  const symptoms = useCreateUserSymptoms();
  const onSubmit = form.handleSubmit((data) => {
    symptoms.mutate(
      {
        condition: 'PCOS (Polycystic Ovary Syndrome)',
        mood: data.mood,
        notes: data.notes!,
        pain_level: data.painLevel[1],
        cycle_day: data.cycleDay,
        user_id,
        symptoms: Object.entries(data)
          .filter(
            ([key]) =>
              key !== 'painLevel' && key !== 'mood' && key !== 'cycleDay' && key !== 'notes'
          )
          .map(([_key, value]) => value)
          .filter(Boolean)
          .join(', '),
      },
      {
        onSuccess: (data) => {
          console.log(data);
          Toast.success('symptoms created');
          navigate.push(`/track/${data.log_id}`);
        },
        onError: async (error) => {
          if (error instanceof HTTPError) {
            const response = await error.response.json<{ error: string }>();
            Toast.error(response.error);
          }
        },
      }
    );
  });

  return (
    <ScrollView backgroundColor={'#fff'} flex={1}>
      <View paddingHorizontal={'$4'} gap={'$1'}>
        <SizableText fontWeight={'$6'} fontSize={'$4'}>
          Today&apos;s Symptoms
        </SizableText>
        <Form gap={'$3'} onSubmit={onSubmit}>
          <View gap={1}>
            <XStack>
              <Controller
                control={form.control}
                name="fatigue"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="fatigue"
                      size={'$4'}
                      labelSize={'$4'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      label="Fatigue"
                      borderColor={'#985CD5'}
                    />
                  );
                }}
              />
            </XStack>
            <XStack>
              <Controller
                control={form.control}
                name="cramps"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="cramps"
                      size={'$4'}
                      labelSize={'$4'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      label="Cramps"
                      borderColor={'#985CD5'}
                    />
                  );
                }}
              />
            </XStack>
            <XStack>
              <Controller
                control={form.control}
                name="headache"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="headache"
                      size={'$4'}
                      labelSize={'$4'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      label="Headache"
                      borderColor={'#985CD5'}
                    />
                  );
                }}
              />
            </XStack>
            <XStack>
              <Controller
                control={form.control}
                name="nausea"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="nausea"
                      size={'$4'}
                      labelSize={'$4'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      label="Nausea"
                      borderColor={'#985CD5'}
                    />
                  );
                }}
              />
            </XStack>
            <XStack>
              <Controller
                control={form.control}
                name="bloating"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="bloating"
                      size={'$4'}
                      labelSize={'$4'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      label="Bloating"
                      borderColor={'#985CD5'}
                    />
                  );
                }}
              />
            </XStack>
          </View>
          <YStack gap={'$3'}>
            <XStack justifyContent="space-between">
              <SizableText size={'$3'} fontWeight={'$6'}>
                Pain Level (1-10)
              </SizableText>
              <SizableText size={'$3'} fontWeight={'$6'}>
                {form.watch('painLevel')}
              </SizableText>
            </XStack>
            <XStack paddingHorizontal={'$2'}>
              <Controller
                control={form.control}
                name="painLevel"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <Slider
                      flex={1}
                      defaultValue={[0]}
                      marginHorizontal={'$1'}
                      max={10}
                      step={1}
                      value={value}
                      onBlur={onBlur}
                      onValueChange={onChange}>
                      <Slider.Track backgroundColor={'#E0DBE5'}>
                        <Slider.TrackActive backgroundColor={'#985CD5'} />
                      </Slider.Track>
                      <Slider.Thumb circular index={1} size={'$1'} />
                    </Slider>
                  );
                }}
              />
            </XStack>
          </YStack>
          <YStack gap={'$3'}>
            <YStack>
              <SizableText size={'$3'} fontWeight={'$6'}>
                Mood
              </SizableText>
              <XStack backgroundColor={'white'}>
                <Controller
                  control={form.control}
                  name="mood"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <Input
                        borderWidth={0}
                        backgroundColor={'#EDE8F2'}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Select"
                        height={50}
                        flex={1}
                        borderStyle="unset"
                        placeholderTextColor={'#734F94'}
                      />
                    );
                  }}
                />
              </XStack>

              {form.formState.errors.mood ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.mood.message}
                </SizableText>
              ) : null}
            </YStack>
            <YStack gap={'$1'}>
              <SizableText size={'$3'} fontWeight={'$6'}>
                Cycle Day
              </SizableText>
              <XStack backgroundColor={'white'}>
                <Controller
                  control={form.control}
                  name="cycleDay"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <Input
                        borderWidth={0}
                        backgroundColor={'#EDE8F2'}
                        value={value as any}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Select"
                        height={50}
                        flex={1}
                        borderStyle="unset"
                        placeholderTextColor={'#734F94'}
                      />
                    );
                  }}
                />
              </XStack>
            </YStack>
            {form.formState.errors.cycleDay ? (
              <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                {form.formState.errors.cycleDay.message}
              </SizableText>
            ) : null}

            <XStack backgroundColor={'white'} marginTop={'$3'}>
              <Controller
                control={form.control}
                name="notes"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <TextArea
                      borderWidth={0}
                      backgroundColor={'#EDE8F2'}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Additional Notes"
                      size={'$4'}
                      flex={1}
                      borderStyle="unset"
                      placeholderTextColor={'#734F94'}
                    />
                  );
                }}
              />
            </XStack>
          </YStack>
          <YStack marginBottom={'$4'}>
            <KeyboardAvoidingView
              style={{ flex: 1, backgroundColor: '#fff' }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <Form.Trigger disabled={symptoms.isPending} asChild>
                <Button
                  icon={symptoms.isPending ? <Spinner size="small" color={'white'} /> : null}
                  title="Submit"
                />
              </Form.Trigger>
            </KeyboardAvoidingView>
          </YStack>
        </Form>
      </View>
    </ScrollView>
  );
};

export default Track;
