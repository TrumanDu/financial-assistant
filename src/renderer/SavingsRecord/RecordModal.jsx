import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';
import { Col, Row, Modal, Form, Toast } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';

const message = '该项为必填项';

const RecordModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const { reloadData } = props;
  const api = useRef();

  useImperativeHandle(ref, () => ({
    showModal: (value) => {
      setRecord(value);
      setVisible(true);
    },
  }));

  const handleOk = async () => {
    let operator = 'addSavingsRecord';
    let operatorDescription = '新增';
    try {
      const values = await api.current.validate();

      if (values.id) {
        operator = 'editSavingsRecord';
        operatorDescription = '编辑';
      }

      window.electron.ipcRenderer.ipcSendSync(operator, {
        record: values,
      });

      setVisible(false); // 先关闭弹窗
      Toast.success(`${operatorDescription}成功`); // 然后显示提示
      reloadData(); // 最后重新加载数据
    } catch (errors) {
      Toast.error(`${operatorDescription}失败`); // 然后显示提示
      console.error(errors);
    }
    return null;
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <Modal
      style={{ width: 600 }}
      title={record != null ? '编辑' : '新增'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      closeOnEsc
    >
      <Form
        initValues={record}
        getFormApi={(formApi) => {
          api.current = formApi;
        }}
      >
        <Row>
          <Col span={24}>
            <Form.Select
              field="owner"
              label="账户"
              placeholder="请选择"
              style={{ width: '100%' }}
              rules={[{ required: true, message }]}
            >
              <Form.Select.Option value="老公">老公</Form.Select.Option>
              <Form.Select.Option value="妻子">妻子</Form.Select.Option>
              <Form.Select.Option value="成员3">成员3</Form.Select.Option>
              <Form.Select.Option value="成员4">成员4</Form.Select.Option>
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Input
              field="name"
              label="产品"
              trigger="blur"
              rules={[{ required: true, message }]}
            />
          </Col>
        </Row>
        <Row>
          <Col span={10}>
            <Form.InputNumber
              field="money"
              label="金额"
              trigger="blur"
              rules={[{ required: true, message }]}
            />
          </Col>
          <Col span={10} offset={4}>
            <Form.Input
              field="rate"
              label="年化利率"
              trigger="blur"
              rules={[{ required: true, message }]}
              suffix="%"
            />
          </Col>
        </Row>
        <Row>
          <Col span={10}>
            <Form.DatePicker
              field="start_date"
              label="开始日期"
              trigger="blur"
              rules={[{ required: true, message }]}
            />
          </Col>
          <Col span={10} offset={4}>
            <Form.DatePicker
              field="end_date"
              label="结束日期"
              trigger="blur"
              rules={[{ required: true, message }]}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
});

RecordModal.propTypes = {
  reloadData: PropTypes.func.isRequired,
};

export default RecordModal;
