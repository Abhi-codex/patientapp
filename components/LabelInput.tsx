import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LabelInputProps } from '../types';
import { styles as s, colors } from '../constants/tailwindStyles';

export default function LabelInput({
  label,
  value,
  onChangeText,
  helperText,
  containerStyle,
  required = false,
  icon,
  ...props
}: LabelInputProps & { required?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: icon ? 44 : 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.gray[400], colors.primary[600]],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', '#FFFFFF'],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 4],
    }),
    zIndex: 2,
    fontWeight: '500' as '500',
    borderRadius: 4,
  };

  const borderColor = isFocused 
    ? colors.primary[500] 
    : value 
    ? colors.medical[500] 
    : colors.gray[300];

  return (
    <View style={[s.mb5, containerStyle]}>
      <View style={s.relative}>
        <Animated.Text style={labelStyle}>
          {label}{required && <Text style={{ color: colors.danger[500] }}> *</Text>}
        </Animated.Text>
        
        {icon && (
          <View style={[
            s.absolute,
            s.left4,
            { top: 20, zIndex: 1 }
          ]}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={isFocused ? colors.primary[500] : colors.gray[400]} 
            />
          </View>
        )}
        
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          style={[
            s.h14,
            s.border2,
            s.roundedXl,
            s.textBase,
            s.textGray900,
            s.bgWhite,
            s.shadowSm,
            { 
              borderColor,
              paddingHorizontal: icon ? 44 : 16,
              paddingTop: 8,
            },
            props.multiline && { 
              height: 'auto',
              minHeight: 80,
              paddingTop: 16,
              textAlignVertical: 'top'
            },
            props.style,
          ]}
          onFocus={e => {
            setIsFocused(true);
            props.onFocus && props.onFocus(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            props.onBlur && props.onBlur(e);
          }}
          placeholderTextColor={colors.gray[400]}
        />
      </View>
      
      {!!helperText && (
        <Text style={[s.textXs, s.textGray600, s.mt1, s.ml4]}>
          {helperText}
        </Text>
      )}
    </View>
  );
}
