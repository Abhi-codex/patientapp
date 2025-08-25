import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LabelSelectProps } from '../types';
import { styles as s, colors } from '../constants/tailwindStyles';

export default function LabelSelect({
  label,
  options,
  value,
  onChange,
  multiple = false,
  helperText,
  containerStyle,
  required = false,
  icon,
}: LabelSelectProps & { required?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  const [isFocused, setIsFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value((Array.isArray(value) ? value.length : value) ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || (Array.isArray(value) ? value.length : value) ? 1 : 0,
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

  const displayValue = Array.isArray(value)
    ? value.length > 0 ? value.join(', ') : ''
    : value;

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
            s.left2,
            { top: 20, zIndex: 1 }
          ]}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={isFocused ? colors.primary[500] : colors.gray[400]} 
            />
          </View>
        )}
        
        <TouchableOpacity
          style={[
            s.h14,
            s.border2,
            s.roundedXl,
            s.bgWhite,
            s.justifyCenter,
            s.shadowSm,
            { 
              borderColor,
              paddingHorizontal: icon ? 44 : 16,
            }
          ]}
          activeOpacity={0.7}
          onPress={() => { setIsFocused(true); setModalVisible(true); }}
        >
          <Text style={[
            s.textBase,
            { 
              color: displayValue ? colors.gray[800] : 'transparent',
              paddingRight: 32
            }
          ]}>
            {displayValue || ''}
          </Text>
          
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={colors.gray[400]} 
            style={[s.absolute, s.right2]} 
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => { setModalVisible(false); setIsFocused(false); }}
      >
        <Pressable 
          style={[
            s.flex1,
            s.justifyCenter,
            s.alignCenter,
            { backgroundColor: 'rgba(0,0,0,0.4)' }
          ]} 
          onPress={() => { setModalVisible(false); setIsFocused(false); }}
        >
          <View style={[
            s.bgWhite,
            s.roundedXl,
            s.m5,
            s.shadowLg,
            { 
              maxHeight: '70%',
              width: '90%'
            }
          ]}> 
            <View style={[
              s.p5,
              s.borderB,
              { borderBottomColor: colors.gray[200] }
            ]}>
              <Text style={[
                s.textXl,
                s.fontSemibold,
                s.textCenter,
                { color: colors.gray[800] }
              ]}>
                Select {label.replace(' *', '')}
              </Text>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={item => item}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const checked = Array.isArray(value)
                  ? value.includes(item)
                  : value === item;
                return (
                  <TouchableOpacity
                    style={[
                      s.flexRow,
                      s.alignCenter,
                      s.p4,
                      s.borderB,
                      { borderBottomColor: colors.gray[100] }
                    ]}
                    onPress={() => {
                      if (multiple) {
                        let newValue = Array.isArray(value) ? [...value] : [];
                        if (checked) {
                          newValue = newValue.filter((v: string) => v !== item);
                        } else {
                          newValue.push(item);
                        }
                        onChange(newValue);
                      } else {
                        onChange(item);
                        setModalVisible(false);
                        setIsFocused(false);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      s.w6,
                      s.h6,
                      s.roundedFull,
                      s.border2,
                      s.alignCenter,
                      s.justifyCenter,
                      s.mr3,
                      { 
                        borderColor: checked ? colors.primary[500] : colors.gray[300],
                        backgroundColor: checked ? colors.primary[500] : 'transparent'
                      }
                    ]}>
                      {checked && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[
                      s.textBase,
                      { 
                        color: checked ? colors.primary[600] : colors.gray[700],
                        fontWeight: checked ? '600' : '400',
                        textTransform: 'capitalize'
                      }
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            
            <View style={s.p5}>
              <TouchableOpacity
                style={[
                  s.py4,
                  s.roundedXl,
                  s.alignCenter,
                  { backgroundColor: colors.primary[500] }
                ]}
                onPress={() => { setModalVisible(false); setIsFocused(false); }}
              >
                <Text style={[
                  s.textBase,
                  s.fontSemibold,
                  { color: '#FFFFFF' }
                ]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      
      {!!helperText && (
        <Text style={[
          s.textXs,
          s.mt1,
          s.ml4,
          { color: colors.gray[500] }
        ]}>
          {helperText}
        </Text>
      )}
    </View>
  );
}
