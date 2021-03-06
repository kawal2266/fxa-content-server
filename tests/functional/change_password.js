/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const TestHelpers = require('../lib/helpers');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');

const config = intern._config;
const SIGNIN_URL = config.fxaContentRoot + 'signin';

const ANIMATION_DELAY_MS = 500;
const FIRST_PASSWORD = 'password';
const SECOND_PASSWORD = 'new_password';

let email;

const {
  clearBrowserState,
  click,
  createUser,
  denormalizeStoredEmail,
  fillOutChangePassword,
  fillOutSignIn,
  noSuchElementDisplayed,
  noSuchElement,
  openPage,
  testElementExists,
  testElementTextEquals,
  thenify,
  type,
  visibleByQSA,
} = FunctionalHelpers;

const setupTest = thenify(function (options = {}) {
  const signUpEmail = options.signUpEmail || email;
  const signInEmail = options.signInEmail || email;

  return this.parent
    .then(createUser(signUpEmail, FIRST_PASSWORD, { preVerified: true }))
    .then(clearBrowserState())
    .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
    .then(fillOutSignIn(signInEmail, FIRST_PASSWORD))

    .then(testElementExists(selectors.SETTINGS.HEADER))
    .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, signUpEmail));
});

registerSuite('change_password', {
  beforeEach: function () {
    email = TestHelpers.createEmail();
  },

  afterEach: function () {
    return this.remote.then(clearBrowserState());
  },
  tests: {
    'sign in, try to change password with an incorrect old password': function () {
      return this.remote
        .then(setupTest())

        // Go to change password screen
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        .then(fillOutChangePassword('INCORRECT', SECOND_PASSWORD, {expectSuccess: false}))
        // the validation tooltip should be visible
        .then(visibleByQSA(selectors.CHANGE_PASSWORD.TOOLTIP))

        // click the show button, the error should not be hidden.
        .then(click(selectors.CHANGE_PASSWORD.OLD_PASSWORD_SHOW))
        .then(visibleByQSA(selectors.CHANGE_PASSWORD.TOOLTIP))

        // Change form so that it is valid, error should be hidden.
        .then(type(selectors.CHANGE_PASSWORD.OLD_PASSWORD, FIRST_PASSWORD))

        // Since the test is to see if the error is hidden,
        // .findByClass cannot be used. We want the opposite of
        // .findByClass.
        .sleep(ANIMATION_DELAY_MS)

        .then(noSuchElementDisplayed(selectors.CHANGE_PASSWORD.ERROR));
    },

    'sign in, try to change password with short password, tooltip shows, cancel, try to change password again, tooltip is not shown': function () {
      return this.remote
        .then(setupTest())

        // Go to change password screen
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        .then(fillOutChangePassword('A', SECOND_PASSWORD, { expectSuccess: false }))
        // the validation tooltip should be visible
        .then(visibleByQSA(selectors.CHANGE_PASSWORD.TOOLTIP))
        // click the cancel button
        .then(click(selectors.CHANGE_PASSWORD.CANCEL_BUTTON))
        .sleep(ANIMATION_DELAY_MS)
        // try to change password again
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        // check no tooltip exists
        .then(noSuchElement(selectors.CHANGE_PASSWORD.TOOLTIP));
    },

    'sign in, change password, sign in with new password': function () {
      return this.remote
        .then(setupTest())

        // Go to change password screen
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))

        .then(fillOutChangePassword(FIRST_PASSWORD, SECOND_PASSWORD))

        .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
        .then(click(selectors.SIGNIN.LINK_USE_DIFFERENT))
        .then(fillOutSignIn(email, SECOND_PASSWORD))

        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'sign in with an unnormalized email, change password, sign in with new password': function () {
      return this.remote
        .then(setupTest({signInEmail: email.toUpperCase(), signUpEmail: email}))

        // Go to change password screen
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))

        .then(fillOutChangePassword(FIRST_PASSWORD, SECOND_PASSWORD))

        .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
        .then(click(selectors.SIGNIN.LINK_USE_DIFFERENT))
        .then(fillOutSignIn(email, SECOND_PASSWORD))

        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'cached unnormalized email, change password, sign in with new password': function () {
      return this.remote
        .then(setupTest())

        // synthesize a user who signed in pre #4470 with an unnormalized email
        .then(denormalizeStoredEmail(email))
        // refresh to load denormalized email from localStorage
        .refresh()
        // email should be normalized on refresh!
        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, email))

        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))

        .then(fillOutChangePassword(FIRST_PASSWORD, SECOND_PASSWORD))

        .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
        .then(click(selectors.SIGNIN.LINK_USE_DIFFERENT))
        .then(fillOutSignIn(email, SECOND_PASSWORD))

        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'sign in, reset password via settings works': function () {
      return this.remote
        .then(setupTest())

        // Go to change password screen
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        .then(click(selectors.CHANGE_PASSWORD.LINK_RESET_PASSWORD))

        .then(testElementExists(selectors.RESET_PASSWORD.HEADER));
    }
  }
});
