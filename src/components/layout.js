import React, { useState, useEffect } from 'react';
import { StaticQuery, graphql } from 'gatsby';
import PropTypes from 'prop-types';
import { Head, Nav, Social, Email, Footer } from '@components';
import styled from 'styled-components';
import { GlobalStyle, theme } from '@styles';
const { colors, fontSizes, fonts } = theme;

const SkipToContent = styled.a`
  position: absolute;
  top: auto;
  left: -999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: -99;
  &:hover {
    background-color: ${colors.darkGrey};
  }
  &:focus,
  &:active {
    outline: 0;
    color: ${colors.blue};
    background-color: ${colors.lightNavy};
    border-radius: ${theme.borderRadius};
    padding: 18px 23px;
    font-size: ${fontSizes.small};
    font-family: ${fonts.SFMono};
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    transition: ${theme.transition};
    top: 0;
    left: 0;
    width: auto;
    height: auto;
    overflow: auto;
    z-index: 99;
  }
`;

const Layout = ({ children }) => {
  const [githubInfo, setGithubInfo] = useState({
    stars: null,
    forks: null,
  });

  useEffect(() => {
    fetch('https://api.github.com/repos/archish27/personal-website')
      .then(response => response.json())
      .then(json => {
        const { stargazers_count, forks_count } = json;
        setGithubInfo({
          stars: stargazers_count,
          forks: forks_count,
        });
      });
  }, []);

  return (
    <StaticQuery
      query={graphql`
        query LayoutQuery {
          site {
            siteMetadata {
              title
              siteUrl
              description
            }
          }
        }
      `}
      render={({ site }) => (
        <div id="root">
          <Head metadata={site.siteMetadata} />

          <GlobalStyle />

          <SkipToContent href="#content">Skip to Content</SkipToContent>

          <div className="container">
            <Nav />
            <Social />
            <Email />
            {children}
            <Footer githubInfo={githubInfo} />
          </div>
        </div>
      )}
    />
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
