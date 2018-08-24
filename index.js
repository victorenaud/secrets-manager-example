const SecretsManager = require('aws-sdk/clients/secretsmanager');

const SECRET_KEY = 'api-key';
const EXCLUDED_CHARACTERS_IN_PASSWORD = "'";
const CREATE_SECRET_STEP = 'createSecret';

module.exports.handler = async function(event) {
  const {
    ClientRequestToken: clientRequestToken,
    SecretId: secretId,
    Step: step
  } = event;

  switch (step) {
    case CREATE_SECRET_STEP:
      return createSecretStep(clientRequestToken, secretId)
      break;
  }

  return 'No creation required on this step';
};

async function createSecretStep(clientRequestToken, secretId) {
  console.log('New secret string needed');
  const secretsManager = new SecretsManager();
  const newAuthorizationValue = await getNewAuthorizationValue(secretsManager);

  await putNewAuthorizationValue(
    secretsManager,
    { clientRequestToken, secretId },
    newAuthorizationValue
  );

  return 'New secret string inserted';
}

function getNewAuthorizationValue(secretsManager) {
  return secretsManager
    .getRandomPassword({
      ExcludeCharacters: EXCLUDED_CHARACTERS_IN_PASSWORD
    })
    .promise()
    .then((getRandomPasswordResult) => getRandomPasswordResult.RandomPassword);
}

function putNewAuthorizationValue(
  secretsManager,
  { clientRequestToken, secretId },
  newAuthorizationValue
) {
  const newSecret = {};
  newSecret[SECRET_KEY] = newAuthorizationValue;
  const newSecretString = JSON.stringify(newSecret);

  return secretsManager
    .putSecretValue({
      SecretId: secretId,
      ClientRequestToken: clientRequestToken,
      SecretString: newSecretString
    })
    .promise();
}

