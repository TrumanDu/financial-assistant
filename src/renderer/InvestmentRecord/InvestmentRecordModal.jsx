import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';
import * as dateFns from 'date-fns';

const InvestmentRecordModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const { reloadData } = props;
  const api = useRef();

  useImperativeHandle(ref, () => ({
    showModal: (value) => {
      setRecord(value || { record_date: new Date() });
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
        <Form.Input
          field="product_name"
          label="产品名"
          placeholder="请输入产品名"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入产品名' }]}
        />
        <Form.InputNumber
          field="principal"
          label="本金"
          placeholder="请输入本金"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入本金' }]}
        />
        <Form.InputNumber
          field="earnings"
          label="收益"
          placeholder="请输入收益"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入收益' }]}
        />
        <Form.InputNumber
          field="days"
          label="天数"
          placeholder="请输入天数"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请输入天数' }]}
        />
        <Form.DatePicker
          field="record_date"
          label="记录日期"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择记录日期' }]}
        />
      </Form>
    </Modal>
  );
});

InvestmentRecordModal.propTypes = {
  reloadData: PropTypes.func.isRequired,
};

export default InvestmentRecordModal;
