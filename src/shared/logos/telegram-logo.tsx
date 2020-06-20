import { Theme } from '@material-ui/core';
import React from 'react';
import { connect } from 'react-redux';
import ApplicationState from '../../core/application-state';
import { COLOR_CHROMIA_DARK, COLOR_CHROMIA_LIGHT, COLOR_STEEL_BLUE } from '../../theme';

interface Props {
  theme: Theme;
}

const TelegramLogo: React.FunctionComponent<Props> = (props: React.PropsWithChildren<Props>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={26}
      height={26}
      viewBox="0 0 256 256"
      version="1.1"
      preserveAspectRatio="xMidYMid"
    >
      <g>
        <path
          d="M128,0 C57.307,0 0,57.307 0,128 L0,128 C0,198.693 57.307,256 128,256 L128,256 C198.693,256 256,198.693 256,128 L256,128 C256,57.307 198.693,0 128,0 L128,0 Z"
          fill={props.theme.palette.type === 'dark' ? COLOR_CHROMIA_LIGHT : COLOR_STEEL_BLUE}
        />
        <path
          d="M190.2826,73.6308 L167.4206,188.8978 C167.4206,188.8978 164.2236,196.8918 155.4306,193.0548 L102.6726,152.6068 L83.4886,143.3348 L51.1946,132.4628 C51.1946,132.4628 46.2386,130.7048 45.7586,126.8678 C45.2796,123.0308 51.3546,120.9528 51.3546,120.9528 L179.7306,70.5928 C179.7306,70.5928 190.2826,65.9568 190.2826,73.6308"
          fill={props.theme.palette.type === 'dark' ? COLOR_CHROMIA_DARK : COLOR_CHROMIA_LIGHT}
        />
        <path
          d="M98.6178,187.6035 C98.6178,187.6035 97.0778,187.4595 95.1588,181.3835 C93.2408,175.3085 83.4888,143.3345 83.4888,143.3345 L161.0258,94.0945 C161.0258,94.0945 165.5028,91.3765 165.3428,94.0945 C165.3428,94.0945 166.1418,94.5735 163.7438,96.8115 C161.3458,99.0505 102.8328,151.6475 102.8328,151.6475"
          fill={props.theme.palette.type === 'dark' ? COLOR_CHROMIA_DARK : COLOR_CHROMIA_LIGHT}
        />
        <path
          d="M122.9015,168.1154 L102.0335,187.1414 C102.0335,187.1414 100.4025,188.3794 98.6175,187.6034 L102.6135,152.2624"
          fill={props.theme.palette.type === 'dark' ? COLOR_CHROMIA_DARK : COLOR_CHROMIA_LIGHT}
        />
      </g>
    </svg>
  );
};

const mapStateToProps = (store: ApplicationState) => {
  return {
    theme: store.styling.theme,
  };
};

export default connect(mapStateToProps)(TelegramLogo);
