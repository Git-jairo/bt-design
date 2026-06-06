import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Icon } from './Icon';

const meta = {
  component: Icon,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'basic-navigation/ChevronDown', size: 24 },
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('img');
    await expect(img).toBeInTheDocument();
    await expect(img).toHaveAttribute('src', '/icons/basic-navigation/ChevronDown.svg');
  },
};

export const Large: Story = {
  args: { name: 'energy/SolarPanel', size: 48 },
};

export const WithAlt: Story = {
  args: { name: 'feedback/ThumbsUp', size: 32, alt: 'Positieve beoordeling' },
};

export const EnergyCategory: Story = {
  args: { name: 'energy/Bulb', size: 32 },
  render: () => (
    <div className="flex gap-4 flex-wrap">
      {(['energy/Bulb', 'energy/SolarPanel', 'energy/WindTurbine', 'energy/Gas', 'energy/Plug'] as const).map((name) => (
        <Icon key={name} name={name} size={32} />
      ))}
    </div>
  ),
};

export const NavigationCategory: Story = {
  args: { name: 'basic-navigation/ChevronDown', size: 24 },
  render: () => (
    <div className="flex gap-4">
      {(['basic-navigation/ChevronDown', 'basic-navigation/ChevronLeft', 'basic-navigation/ChevronRight', 'basic-navigation/ChevronUp', 'basic-navigation/Close'] as const).map((name) => (
        <Icon key={name} name={name} size={24} />
      ))}
    </div>
  ),
};
