import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';

const InvestmentModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const { reloadData } = props;
  const api = useRef();

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
      let operator = 'addInvestment';
      if (record?.id) {
        operator = 'editInvestment';
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
      title={record ? '编辑理财产品' : '新增理财产品'}
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
        <Form.Input
          field="bank"
          label="银行"
          placeholder="请输入银行名称"
          rules={[{ required: true, message: '请输入银行名称' }]}
        />
        <Form.Input
          field="name"
          label="产品名称"
          placeholder="请输入产品名称"
          rules={[{ required: true, message: '请输入产品名称' }]}
        />
        <Form.Select
          field="owner"
          label="账户"
          placeholder="请选择"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入账户' }]}
        >
          <Form.Select.Option value="老公">老公</Form.Select.Option>
          <Form.Select.Option value="妻子">妻子</Form.Select.Option>
          <Form.Select.Option value="成员3">成员3</Form.Select.Option>
          <Form.Select.Option value="成员4">成员4</Form.Select.Option>
        </Form.Select>
      </Form>
    </Modal>
  );
});

InvestmentModal.propTypes = {
  reloadData: PropTypes.func.isRequired,
};

export default InvestmentModal;
