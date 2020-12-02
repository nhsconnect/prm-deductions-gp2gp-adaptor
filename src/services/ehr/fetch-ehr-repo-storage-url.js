import axios from 'axios';
import { initialiseConfig } from '../../config';
import { logError } from '../../middleware/logging';

export const fetchStorageUrl = async body => {
  const config = initialiseConfig();
  try {
    return await axios.post(
      `${config.ehrRepoUrl}/fragments`,
      { ...body, isLargeMessage: false },
      {
        headers: { Authorization: `${config.ehrRepoAuthKeys}` }
      }
    );
  } catch (err) {
    logError('failed to get pre-signed url', { error: err.stack });
    throw err;
  }
};
