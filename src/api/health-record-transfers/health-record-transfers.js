import { body } from 'express-validator';
import { retrieveEhrFromRepo } from '../../services/ehr/retrieve-ehr-from-repo';
import { parseMultipartBody } from '../../services/parser';
import { sendMessage } from '../../services/mhs/mhs-outbound-client';

export const healthRecordTransferValidation = [
  body('data.type')
    .equals('health-record-transfers')
    .withMessage("Provided value is not 'health-record-transfers'"),
  body('data.id').isUUID().withMessage("'conversationId' provided is not of type UUID"),
  body('data.attributes.odsCode').notEmpty().withMessage('Value has not been provided'),
  body('data.attributes.ehrRequestId').isUUID().withMessage('Provided value is not of type UUID'),
  body('data.links.currentEhrUrl').notEmpty().withMessage('Value has not been provided')
];

export const healthRecordTransfers = async (req, res) => {
  const { data } = req.body;
  const {
    id: conversationId,
    attributes: { odsCode },
    links: { currentEhrUrl }
  } = data;
  const interactionId = 'RCMR_IN030000UK06';
  const ehrExtract = await retrieveEhrFromRepo(currentEhrUrl);
  const multipartMessage = parseMultipartBody(ehrExtract);
  const ehrMessage = multipartMessage[1].body;
  await sendMessage({ interactionId, conversationId, odsCode, message: ehrMessage });

  res.sendStatus(204);
};