import React from 'react';
import { FreeTierGate, type FreeTierGateProps } from '../FreeTierGate';

/**
 * Higher-order component to wrap content with access control
 */
export function withFreeTierGate<P extends object>(
  Component: React.ComponentType<P>,
  gateProps?: Omit<FreeTierGateProps, 'children'>
) {
  return function WrappedComponent(props: P & { termId?: string }) {
    const { termId, ...componentProps } = props;

    return (
      <FreeTierGate termId={termId} {...gateProps}>
        <Component {...(componentProps as P)} />
      </FreeTierGate>
    );
  };
}