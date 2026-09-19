import React, { ReactNode } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { colors } from '../theme/tokens';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.base} />
      <View style={styles.container}>
        {/* Deep ambient background aura */}
        <View style={styles.ambientAura} />
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  ambientAura: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
});
