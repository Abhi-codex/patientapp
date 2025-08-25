import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles } from '../../constants/tailwindStyles';
import { EMERGENCY_CATEGORIES, EMERGENCY_TYPES, EmergencyCategory, EmergencyType } from '../../types/emergency';

export default function EmergencySelectionScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Filter emergencies based on search query
  const filteredEmergencies = useMemo(() => {
    if (!searchQuery.trim()) return EMERGENCY_TYPES;
    
    const query = searchQuery.toLowerCase();
    return EMERGENCY_TYPES.filter(emergency => 
      emergency.name.toLowerCase().includes(query) ||
      emergency.description.toLowerCase().includes(query) ||
      emergency.searchKeywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Get emergencies for selected category
  const categoryEmergencies = useMemo(() => {
    if (!selectedCategory) return [];
    return EMERGENCY_TYPES.filter(emergency => emergency.category === selectedCategory);
  }, [selectedCategory]);

  const handleEmergencySelect = (emergency: EmergencyType) => {
    // Navigate to booking with emergency context
    router.push({
      pathname: '/screens/BookingScreen',
      params: {
        emergencyType: emergency.id,
        emergencyName: emergency.name,
        requiredAmbulanceTypes: JSON.stringify(emergency.requiredAmbulanceTypes),
        requiredServices: JSON.stringify(emergency.requiredHospitalServices),
        priority: emergency.priority,
      }
    });
  };

  // Helper to render the correct icon component
  const renderIcon = (iconObj: { name: string; library: string }, size = 28, color = '#ef4444') => {
    if (!iconObj) return null;
    const { name, library } = iconObj;
    switch (library) {
      case 'FontAwesome5':
        return <FontAwesome5 name={name as any} size={size} color={color} />;
      case 'FontAwesome':
        return <FontAwesome name={name as any} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={name as any} size={size} color={color} />;
      default:
        return <FontAwesome5 name="question" size={size} color={color} />;
    }
  };

  const renderEmergencyTile = ({ item }: { item: EmergencyType }) => (
    <TouchableOpacity
      style={[styles.p4, styles.bgWhite, styles.roundedXl, styles.mb3, styles.shadowSm,
        { backgroundColor: getPriorityColor(item.priority) }]}
      onPress={() => handleEmergencySelect(item)} activeOpacity={0.7}>
      <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
        <View style={[styles.mr3]}>
          {renderIcon(item.icon, 28, colors.emergency[600])}
        </View>
        <View style={[styles.flex1]}>
          <Text style={[styles.textBase, styles.fontSemibold, styles.textGray800]}>
            {item.name}
          </Text>
          <Text style={[styles.textXs, styles.textGray600]}>
            {item.description}
          </Text>
        </View>
        <View style={[styles.alignCenter]}>
        </View>
      </View>
      <View style={[styles.flexRow, styles.justifyEnd]}>
        {item.requiredAmbulanceTypes.slice(0, 3).map((type, index) => (
          <View  key={index} style={[styles.px2, styles.py1, styles.roundedMd, styles.mr1, styles.mb1, 
          { backgroundColor: colors.primary[500] }]}>
            <Text style={[styles.textXs, styles.textWhite]}>
              {type.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderCategoryTile = ({ item }: { item: EmergencyCategory }) => (
    <TouchableOpacity
      style={[styles.p2, styles.rounded2xl, styles.mr2, styles.mb3, styles.alignCenter, styles.w30,
        { backgroundColor: item.color + '15' }]} onPress={() => setSelectedCategory(item.id)} activeOpacity={0.7}>
      <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {renderIcon(item.icon, 32, item.color)}
        <View style={[styles.absolute, styles.top0, styles.right0, styles.bgPrimary500, styles.roundedFull,
          styles.px2, styles.h6, styles.alignCenter, styles.justifyCenter, { backgroundColor: item.color, minWidth: 22 }]}>
          <Text style={[styles.textWhite, styles.textXs, styles.fontBold]}>
            {item.emergencies.length}
          </Text>
        </View>
      </View>
      <Text style={[styles.textSm, styles.fontMedium, styles.textCenter, { color: item.color }]}> 
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#eab1b1ff';
      case 'high': return '#ffd896ff';
      case 'medium': return '#c1b5f1ff';
      case 'low': return '#72d7b6ff';
      default: return '#b3c0daff';
    }
  };

  return (
    <SafeAreaView style={[styles.flex1, { paddingTop: insets.top, backgroundColor: colors.gray[50] }]}>
      {/* Header */}
      <View style={[styles.px5, styles.py3]}>
        {/* Search Bar */}
        <View style={[styles.flexRow, styles.alignCenter, styles.bgGray100, styles.shadowSm, styles.roundedXl, styles.px3, styles.py2]}>
          <Ionicons name="search" size={20} color={colors.gray[400]} />
          <TextInput
            style={[styles.flex1, styles.ml3, styles.textBase]}
            placeholder="Search emergency type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim() === '' && selectedCategory === null && (
        <FlatList
          ListHeaderComponent={
            <>
              {/* Common Emergencies */}
              <View style={[styles.px5]}>
                <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800, styles.mb3]}>
                  Common Emergencies
                </Text>
                {EMERGENCY_TYPES.filter(e => ['heart_attack', 'stroke', 'breathing_difficulty', 'major_trauma', 'chest_pain'].includes(e.id)).map((emergency) => (
                  <TouchableOpacity
                    key={emergency.id}
                    style={[
                      styles.py2, styles.px5, styles.roundedXl, styles.mb3, styles.shadowSm,
                      { backgroundColor: getPriorityColor(emergency.priority) }]}
                    onPress={() => handleEmergencySelect(emergency)} activeOpacity={0.7}>
                    <View style={[styles.flexRow, styles.alignCenter]}>
                      <View style={[styles.mr4]}>
                        {renderIcon(emergency.icon, 28, colors.emergency[600])}
                      </View>
                      <View style={[styles.flex1]}>
                        <Text style={[styles.textBase, styles.fontSemibold, styles.textGray800]}>
                          {emergency.name}
                        </Text>
                        <Text style={[styles.textSm, styles.textGray600]}>
                          {emergency.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Category Title */}
              <View style={[styles.mt5]}>
                <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800, styles.px5, styles.mb3]}>
                  Browse by Category
                </Text>
              </View>
            </>
          }
          data={EMERGENCY_CATEGORIES}
          renderItem={renderCategoryTile}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: 85 + Math.max(insets.bottom - 8, 0) }} // Account for tab bar
          showsVerticalScrollIndicator={false}
        />
      )}

        {/* Category-specific emergencies */}
        {selectedCategory !== null && searchQuery.trim() === '' && (
          <View style={[styles.px5, styles.mt4]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mb4]}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={[styles.mr3]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.gray[600]} />
              </TouchableOpacity>
              <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800]}>
                {EMERGENCY_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </Text>
            </View>
            <FlatList
              data={categoryEmergencies}
              renderItem={renderEmergencyTile}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* Search Results */}
        {searchQuery.trim() !== '' && (
          <View style={[styles.px5, styles.mt4]}>
            <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800, styles.mb3]}>
              Search Results ({filteredEmergencies.length})
            </Text>
            {filteredEmergencies.length === 0 ? (
              <View style={[styles.alignCenter, styles.py6]}>
                <Ionicons name="search" size={48} color={colors.gray[300]} />
                <Text style={[styles.textBase, styles.textGray500, styles.mt2]}>
                  No emergencies found
                </Text>
                <Text style={[styles.textSm, styles.textGray400, styles.textCenter, styles.mt1]}>
                  Try different keywords or browse categories
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredEmergencies}
                renderItem={renderEmergencyTile}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              />
            )}
          </View>
        )}
        <View style={[styles.h16]} />
    </SafeAreaView>
  );
}
