/* eslint-disable react/require-default-props */
import { IconInfoCircle } from '@douyinfe/semi-icons';
import { Tooltip, Typography } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';

const { Text } = Typography;

function MetricCard({ title, value, tooltip = '' }) {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--semi-color-bg-2)',
        borderRadius: '8px',
        flex: 1,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}
      >
        <Text type="tertiary" size="small">
          {title}
        </Text>
        {tooltip && (
          <Tooltip content={tooltip}>
            <IconInfoCircle
              style={{ marginLeft: '4px', color: 'var(--semi-color-text-2)' }}
              size="small"
            />
          </Tooltip>
        )}
      </div>
      <Text style={{ fontSize: '30px', fontWeight: 600 }}>¥ {value}</Text>
    </div>
  );
}

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tooltip: PropTypes.string,
};

export default MetricCard;
