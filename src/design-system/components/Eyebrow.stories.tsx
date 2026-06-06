import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Eyebrow } from './Eyebrow';

const meta = {
  component: Eyebrow,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Energie & internet', variant: 'default' },
};

export const Light: Story = {
  args: { label: 'Onze producten', variant: 'light' },
  parameters: { backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-8">
        <Story />
      </div>
    ),
  ],
};
