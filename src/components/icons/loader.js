import React from 'react';
import { theme } from '@styles';
const { colors } = theme;

const IconLoader = () => (
  <svg id="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <title>Loader Logo</title>
    <g>
      <g id="A">
        <path d="M24,62 L42,26 L60,62 L42,52 Z" fill={colors.blue} />
      </g>
      <path
        stroke={colors.white}
        d="M 32, 52
                    L 42, 44.5
                    L 52, 52
                    L 42, 32 Z"
      />

      <circle cx="42" cy="44" r="36" stroke={colors.blue} strokeWidth="2" />
    </g>
  </svg>
);

export default IconLoader;
