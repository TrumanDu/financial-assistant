import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';

const BillRecordModal = forwardRef((props, ref) => {
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
      let operator = 'addBillRecord';
      if (record?.id) {
        operator = 'editBillRecord';
        values.id = record.id;
      }

      const result = window.electron.ipcRenderer.ipcSendSync(operator, {
        record: values,
      });

      if (result.error) {
        Toast.error(result.error);
      } else {
        Toast.success('保存成功');
        setVisible(false);
        reloadData();
      }
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
      title={record ? '编辑账单' : '新增账单'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      centered
    >
      <Form
        initValues={{
          ...record,
          month: record ? new Date(record.month) : new Date(),
        }}
        getFormApi={(formApi) => {
          api.current = formApi;
        }}
      >
        <Form.Select
          field="account"
          label="账户"
          placeholder="请选择账户"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择账户' }]}
        >
          <Form.Select.Option value="老公">老公</Form.Select.Option>
          <Form.Select.Option value="妻子">妻子</Form.Select.Option>
          <Form.Select.Option value="孩子">孩子</Form.Select.Option>
          <Form.Select.Option value="成员1">成员1</Form.Select.Option>
          <Form.Select.Option value="成员2">成员2</Form.Select.Option>
          <Form.Select.Option value="成员3">成员3</Form.Select.Option>
        </Form.Select>
        <Form.InputNumber
          field="amount"
          label="金额"
          placeholder="请输入金额"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入金额' }]}
        />
        <Form.DatePicker
          field="month"
          label="月份"
          type="month"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择月份' }]}
        />
        <Form.TextArea field="memo" label="备注" placeholder="请输入备注" />
      </Form>
    </Modal>
  );
});

BillRecordModal.propTypes = {
  reloadData: PropTypes.func.isRequired,
};

export default BillRecordModal;
