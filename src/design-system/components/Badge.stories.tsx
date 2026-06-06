import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './Badge';

const meta = {
  component: Badge,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {
  args: { children: 'Nieuw', variant: 'brand' },
};

export const Neutral: Story = {
  args: { children: 'Actief', variant: 'neutral' },
};

export const Highlight: Story = {
  args: { children: 'Beta', variant: 'highlight' },
};
