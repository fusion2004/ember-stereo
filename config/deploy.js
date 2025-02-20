/* eslint-env node */
'use strict';

module.exports = function(deployTarget) {
  let ENV = {
    build: {},
    git: {
      repo: 'git@github.com:jkeen/ember-stereo.git'
    },
    // 'git-ci': {
    //   userName: 'deploy',
    //   userEmail: 'deploy@circleci',
    //   deployKeyPath: '/home/circleci/.ssh/id_rsa_11a220e35b2e16b1d43e05e51c5f4c26',
    // },
    // include other plugin configuration that applies to all deploy targets here
  };

  if (deployTarget === 'development') {
    ENV.build.environment = 'development';
    // configure other plugins for development deploy target here
  }

  if (deployTarget === 'staging') {
    ENV.build.environment = 'production';
    // configure other plugins for staging deploy target here
  }

  if (deployTarget === 'production') {
    ENV.build.environment = 'production';
    // configure other plugins for production deploy target here
  }

  // Note: if you need to build some configuration asynchronously, you can return
  // a promise that resolves with the ENV object instead of returning the
  // ENV object synchronously.
  return ENV;
};
