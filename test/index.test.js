jest.mock('aws-sdk/clients/secretsmanager');
const secretsManager = require('aws-sdk/clients/secretsmanager');
const lambdaHandler = require('..').handler;

describe('rotate-secrets', () => {
  let putSecretValueStub, getRandomPasswordStub;
  const SECRET_KEY = 'api-key';
  const NEW_AUTHORIZATION_VALUE = 'random-generated-password';
  const SECRETS_ARN = 'arn.of.secrets';
  const CLIENT_REQUEST_TOKEN = 'new-version-id-for-new-secrets';

  const EVENT = {
    ClientRequestToken: CLIENT_REQUEST_TOKEN,
    SecretId: SECRETS_ARN,
    Step: 'createSecret'
  };

  beforeEach(() => {
    getRandomPasswordStub = jest.fn().mockImplementation(() => ({
      promise: () =>
        Promise.resolve({ RandomPassword: NEW_AUTHORIZATION_VALUE })
    }));

    putSecretValueStub = jest.fn().mockImplementation(() => ({
      promise: () => Promise.resolve()
    }));

    secretsManager.mockImplementation(() => ({
      getRandomPassword: getRandomPasswordStub,
      putSecretValue: putSecretValueStub
    }));
  });

  describe('on createSecret step', () => {
    test('should put a new secret in Secrets Manager given a ClientRequestToken and a random password', async () => {
      await lambdaHandler(EVENT);
      expect(putSecretValueStub).toHaveBeenCalledWith({
        SecretId: SECRETS_ARN,
        ClientRequestToken: CLIENT_REQUEST_TOKEN,
        SecretString: `{"${SECRET_KEY}":"${NEW_AUTHORIZATION_VALUE}"}`
      });
    });

    test('should stringify received secret before putting it in Secrets Manager', async () => {
      const newPassword = 'N\n';
      getRandomPasswordStub = jest.fn().mockImplementation(() => ({
        promise: () => Promise.resolve({ RandomPassword: newPassword })
      }));
      const expectedSecretString = JSON.stringify({
        'api-key': newPassword
      });

      await lambdaHandler(EVENT);

      expect(putSecretValueStub).toHaveBeenCalledWith({
        SecretId: SECRETS_ARN,
        ClientRequestToken: CLIENT_REQUEST_TOKEN,
        SecretString: expectedSecretString
      });
    });

    test('should get a password with no single quotes', async () => {
      await lambdaHandler(EVENT);

      expect(getRandomPasswordStub).toHaveBeenCalledWith({
        ExcludeCharacters: "'"
      });
    });
  });
});

