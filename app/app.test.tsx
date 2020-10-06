import React from 'react';
import { render } from '@testing-library/react';
import App from './app';

test('renders Feed Heading', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Feed/i);

  expect(linkElement).toBeDefined();
});
