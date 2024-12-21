import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';

const InvestmentRecordModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [investmentOptions, setInvestmentOptions] = useState([]);
  const { reloadData } = props;
  const api = useRef();

  const getInvestmentOptions = async () => {
    try {
      const options = window.electron.ipcRenderer.ipcSendSync(
        'getInvestmentOptions',
      );
      setInvestmentOptions(
        options.map((item) => ({
          value: item.id,
          label: `${item.owner} - ${item.name}`,
        })),
      );
    } catch (error) {
      Toast.error('获取产品列表失败');
      console.error(error);
    }
  };

  useEffect(() => {
    if (visible) {
      getInvestmentOptions();
    }
  }, [visible]);

  useImperativeHandle(ref, () => ({
    showModal: (value) => {
      setRecord(value);
      setVisible(true);
    },
  }));

  const handleOk = async () => {
    setLoading(true);
    try {
      const values = await api.current.validate();
      let operator = 'addInvestmentRecord';
      if (record?.id) {
        operator = 'editInvestmentRecord';
      }
      window.electron.ipcRenderer.ipcSendSync(operator, {
        record: values,
      });
      Toast.success('保存成功');
      setVisible(false);
      reloadData();
    } catch (error) {
      Toast.error('保存失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <Modal
      title={record ? '编辑收益记录' : '新增收益记录'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      centered
    >
      <Form
        initValues={record}
        getFormApi={(formApi) => {
          api.current = formApi;
        }}
      >
        <Form.Select
          field="investment_id"
          label="产品"
          placeholder="请选择产品"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择产品' }]}
        >
          {investmentOptions.map((option) => (
            <Form.Select.Option key={option.value} value={option.value}>
              {option.label}
            </Form.Select.Option>
          ))}
        </Form.Select>
        <Form.InputNumber
          field="money"
          label="金额"
          placeholder="请输入金额"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入金额' }]}
        />
        <Form.DatePicker
          field="in_date"
          label="记录时间"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择记录时间' }]}
        />
      </Form>
    </Modal>
  );
});

InvestmentRecordModal.propTypes = {
  reloadData: PropTypes.func.isRequired,
};

export default InvestmentRecordModal;
