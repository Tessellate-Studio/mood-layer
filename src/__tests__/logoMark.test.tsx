// LogoMark: the stacked-strata app mark, drawn inline from theme tokens so it
// can be mood-tinted (the logo-handoff variants swap which families stack).

import React from 'react';
import { render } from '@testing-library/react-native';

import LogoMark from '@/components/LogoMark';

describe('LogoMark', () => {
  it('renders the fixed brand stack by default', () => {
    expect(render(<LogoMark />).toJSON()).toBeTruthy();
  });

  it('renders a mood-tinted stack, padding short lists to three bands', () => {
    expect(render(<LogoMark families={['enjoyment']} />).toJSON()).toBeTruthy();
    expect(
      render(<LogoMark families={['sadness', 'enjoyment', 'fear']} size={40} />).toJSON()
    ).toBeTruthy();
  });
});
