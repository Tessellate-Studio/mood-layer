// Screen-level error boundary. Local-only app (hard rule, CLAUDE.md): errors
// go to the console only — no Sentry, no Crashlytics, no network.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';

interface Props {
  /** Screen name, prefixed onto the console log so the source is obvious. */
  name: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ScreenErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[screen-error]', this.props.name, error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Something slipped out of place
        </Text>
        <Text style={styles.body}>
          This screen hit a snag. Nothing you recorded is lost.
        </Text>
        <Pressable
          testID="error-retry"
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={styles.retry}
          onPress={this.handleRetry}
        >
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.lg,
    minHeight: hitTarget,
    minWidth: hitTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    ...typography.label,
    color: colors.paper,
  },
});

export default ScreenErrorBoundary;
