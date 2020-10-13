import React from 'react';
import { render } from '@testing-library/react';
import App from './app';

test('renders Channel Heading', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Channel/i);

  expect(linkElement).toBeDefined();
});
