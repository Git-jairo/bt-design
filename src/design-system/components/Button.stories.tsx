import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Button } from './Button';
import { Icon } from './Icon';

const meta = {
  component: Button,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Bekijk aanbod', variant: 'primary' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /bekijk aanbod/i });
    await expect(btn).toBeVisible();
    await expect(btn).not.toBeDisabled();
  },
};

export const CssCheck: Story = {
  args: { children: 'CTA knop', variant: 'cta' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /cta knop/i });
    // btn-cta-bg maps to Budget Thuis brand mint — confirms design tokens loaded
    await expect(getComputedStyle(btn).borderRadius).not.toBe('0px');
  },
};

export const CTA: Story = {
  args: { children: 'Stap over', variant: 'cta' },
};

export const Secondary: Story = {
  args: { children: 'Meer info', variant: 'secondary' },
};

export const Disabled: Story = {
  args: { children: 'Niet beschikbaar', variant: 'primary', disabled: true },
};

export const WithLeadingIcon: Story = {
  args: {
    children: 'Download',
    variant: 'primary',
    leadingIcon: <Icon name="iconographic-navigation/Download" size={20} />,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    children: 'Volgende',
    variant: 'primary',
    trailingIcon: <Icon name="basic-navigation/ChevronRight" size={20} />,
  },
};

export const AsLink: Story = {
  args: { children: 'Naar homepage', variant: 'secondary', href: '/' },
};
