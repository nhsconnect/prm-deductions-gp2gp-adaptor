import { body, param } from 'express-validator';
import { buildEhrAcknowledgement } from '../../templates/generate-ehr-acknowledgement';
import { sendMessage } from '../../services/mhs/mhs-outbound-client';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';
import { getPracticeAsid } from '../../services/mhs/mhs-route-client';

export const acknowledgementValidation = [
  param('nhsNumber').isNumeric().withMessage(`'nhsNumber' provided is not numeric`),
  param('nhsNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 digits"),
  body('conversationId').isUUID('4').withMessage("'conversationId' provided is not of type UUIDv4"),
  body('conversationId').notEmpty().withMessage("'conversationId' is not configured"),
  body('messageId').isUUID('4').withMessage("'messageId' provided is not of type UUIDv4"),
  body('messageId').notEmpty().withMessage("'messageId' is not configured"),
  body('odsCode').notEmpty().withMessage("'odsCode' is not configured"),
  body('repositoryAsid').notEmpty().withMessage("'repositoryAsid' is not configured")
];

export const sendEhrAcknowledgement = async (req, res) => {
  try {
    const interactionId = 'MCCI_IN010000UK13';
    const { messageId, conversationId, odsCode, repositoryAsid } = req.body;
    const practiceAsid = await getPracticeAsid(odsCode);
    const acknowledgementMessage = await buildEhrAcknowledgement({
      conversationId,
      practiceAsid,
      repositoryAsid,
      messageId
    });
    await sendMessage({ interactionId, conversationId, odsCode, acknowledgementMessage });
    updateLogEvent({ status: 'Acknowledgement sent to MHS' });
    res.sendStatus(204);
  } catch (err) {
    updateLogEventWithError(err);
    res.status(503).json({
      errors: err.message
    });
  }
};
