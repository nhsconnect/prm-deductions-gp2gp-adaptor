import dateFormat from 'dateformat';
import { v4 as uuid } from 'uuid';
import { initialiseConfig } from '../../config';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';
import * as mhsGatewayFake from '../../services/mhs/mhs-old-queue-test-helper';
import generateEhrRequestQuery from '../../templates/ehr-request-template';

const sendEhrRequest = (nhsNumber, odsCode) => {
  const mhs = mhsGatewayFake;
  const config = initialiseConfig();

  updateLogEvent({
    status: 'fetching-routing-info',
    ehrRequest: { nhsNumber, odsCode }
  });

  return mhs
    .getRoutingInformation(odsCode)
    .then(({ asid }) => {
      updateLogEvent({ status: 'requesting-ehr', ehrRequest: { asid } });

      const timestamp = dateFormat(Date.now(), 'yyyymmddHHMMss');
      const ehrRequestQuery = generateEhrRequestQuery({
        id: uuid(),
        timestamp: timestamp,
        receivingService: {
          asid,
          odsCode
        },
        sendingService: {
          asid: config.deductionsAsid,
          odsCode: config.deductionsOdsCode
        },
        patient: {
          nhsNumber: nhsNumber
        }
      });
      return mhs.sendMessage(ehrRequestQuery).catch(err => {
        updateLogEventWithError(err);
        return Promise.reject(err);
      });
    })
    .then(() => updateLogEvent({ status: 'requested-ehr' }));
};

export default sendEhrRequest;
