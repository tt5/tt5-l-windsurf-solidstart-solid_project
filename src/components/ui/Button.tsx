import { JSX, ParentComponent, Show, splitProps } from 'solid-js';

type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'ghost';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: ParentComponent<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'class',
    'classList',
    'children',
    'variant',
    'loading',
    'fullWidth',
    'disabled'
  ]);

  const variant = () => local.variant || 'primary';
  const isDisabled = () => local.disabled || local.loading;

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-800'
  };

  return (
    <button
      {...rest}
      classList={{
        'px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500': true,
        'opacity-60 cursor-not-allowed': isDisabled(),
        'w-full': local.fullWidth,
        [variantClasses[variant()]]: true,
        ...local.classList,
        [local.class || '']: !!local.class
      }}
      disabled={isDisabled()}
    >
      <Show when={local.loading} fallback={local.children}>
        <div class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      </Show>
    </button>
  );
};

export default Button;
