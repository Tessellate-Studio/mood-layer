// Screen-level error boundary. Errors always go to the console; they are ALSO
// sent to Sentry, but only if the user turned crash reports on in Settings
// (off by default) — reportError() no-ops otherwise, so this file needs no
// consent check of its own. What gets sent is scrubbed to the shape of the
// failure, never its content: services/crashReporting.ts + the privacy review
// in docs/SECURITY.md.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import { reportError } from '@/services/crashReporting';

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
    reportError(error);
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
