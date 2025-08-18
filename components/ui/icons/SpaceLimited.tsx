import { SVGProps } from 'react';
const SpaceLimited = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" id="icon" viewBox="0 0 48 48" {...props}>
    <path
      fill="var(--icon-color-1,var(--icon-color,currentColor))"
      d="M12.267 22.8a4.382 4.382 0 0 0 4.385-4.4c0-2.435-1.95-4.4-4.386-4.4a4.394 4.394 0 0 0-4.4 4.4c0 2.435 1.966 4.4 4.4 4.4Zm0 2.2C8.849 25 2 26.716 2 30.133V33.8h20.533v-3.667c0-3.417-6.85-5.133-10.267-5.133Z"
    />
    <path
      fill="var(--icon-color-2,var(--icon-color,currentColor))"
      d="M24 22.8a4.382 4.382 0 0 0 4.385-4.4A4.38 4.38 0 0 0 24 14a4.394 4.394 0 0 0-4.4 4.4c0 2.435 1.965 4.4 4.4 4.4Zm.075 2.2c-.425 0-.91.03-1.423.074 1.702 1.232 2.89 2.889 2.89 5.06V33.8h8.8v-3.666c0-3.418-6.85-5.134-10.267-5.134Z"
    />
    <path
      fill="var(--icon-color-3,var(--icon-color,currentColor))"
      d="M35.733 22.8a4.382 4.382 0 0 0 4.385-4.4 4.38 4.38 0 0 0-4.385-4.4 4.394 4.394 0 0 0-4.4 4.4c0 2.435 1.965 4.4 4.4 4.4Zm0 2.2c-.425 0-.909.03-1.422.073 1.701 1.232 2.89 2.89 2.89 5.06V33.8H46v-3.667C46 26.716 39.15 25 35.733 25Z"
    />
    <style />
  </svg>
);
export default SpaceLimited;
