import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import {useIntl} from 'react-intl';

import Button from 'components/Button';
import Caption from 'components/Caption';
import { Table, TableRow, TableHead, TableCell } from 'components/Table';
import { Toolbar, ToolbarList } from 'components/Toolbar';
import {getBEMClassName} from 'utils';

import {
  getComponentLabel,
  getComponentValue,
  iterComponentsWithData,
  displayValue
} from 'components/FormStepSummary/utils';


const FormStepSummary = ({stepData, editStepUrl, editStepText}) => {
  const history = useHistory();
  const intl = useIntl();
  return (
    <>
      <Toolbar modifiers={['compact']}>
        <ToolbarList>
          <Caption component={'span'}>{stepData.title}</Caption>
        </ToolbarList>
        <ToolbarList>
          <Button
            variant="anchor"
            component="a"
            href={editStepUrl}
            onClick={(event) => {
              event.preventDefault();
              history.push(editStepUrl);
            }}
          >
            {editStepText}
          </Button>
        </ToolbarList>
      </Toolbar>

      <Table>
        {
          /*
          * Loop through each field in the step
          * stepData contains 4 things.
          * title (string), submissionStep (object), data (object), configuration (object)
          * Note that the `components` should already be flattened!
          */
          iterComponentsWithData(stepData.configuration.components, stepData.data).map((component) => {
            const {key, type, value} = component;
            const className = getBEMClassName('summary-row', [type]);
            return (
              <TableRow key={key} className={className}>
                <TableHead>
                  {getComponentLabel(component)}
                </TableHead>
                <TableCell>
                  {getComponentValue(displayValue(value), intl)}
                </TableCell>
              </TableRow>
            );
          })
        }
      </Table>

    </>
  );
};

FormStepSummary.propTypes = {
  stepData: PropTypes.object.isRequired,
  editStepUrl: PropTypes.string.isRequired,
  editStepText: PropTypes.string.isRequired,
};

export default FormStepSummary;
