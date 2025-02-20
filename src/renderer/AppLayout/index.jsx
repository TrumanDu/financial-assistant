import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { Layout, Nav } from '@douyinfe/semi-ui';
import {
  IconHome,
  IconCalendar,
  IconShoppingBag,
  IconCreditCard,
  IconSearch,
} from '@douyinfe/semi-icons';

function AppLayout() {
  const { Footer, Sider, Content } = Layout;
  const location = useLocation();
  const navigate = useNavigate();
  const [selectKey, setSelectKey] = useState([location.pathname]);

  return (
    <Layout
      style={{
        border: '1px solid var(--semi-color-border)',
        overflowY: 'hidden',
        height: '98vh',
      }}
    >
      <Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
        <Nav
          defaultSelectedKeys={selectKey}
          style={{ maxWidth: 220, height: '100%' }}
          items={[
            {
              itemKey: '/',
              text: '首页',
              icon: <IconHome size="large" style={{ color: '#9C27B0' }} />,
              onClick: () => {
                navigate('/');
                setSelectKey(['/']);
              },
            },
            {
              itemKey: '/record_assets',
              text: '资产记录',
              icon: (
                <IconCreditCard size="large" style={{ color: '#FF9800' }} />
              ),
              onClick: () => {
                navigate('/record_assets');
                setSelectKey(['/record_assets']);
              },
            },
            {
              itemKey: '/bill_record',
              text: '账单记录',
              icon: (
                <IconShoppingBag size="large" style={{ color: '#4CAF50' }} />
              ),
              onClick: () => {
                navigate('/bill_record');
                setSelectKey(['/bill_record']);
              },
            },
            {
              itemKey: '/investment_record',
              text: '理财收益记录',
              icon: <IconCalendar size="large" style={{ color: '#FF9800' }} />,
              onClick: () => {
                navigate('/investment_record');
                setSelectKey(['/investment_record']);
              },
            },
            {
              itemKey: '/product_discovery',
              text: '理财产品发现',
              icon: <IconSearch size="large" style={{ color: '#2196F3' }} />,
              onClick: () => {
                navigate('/product_discovery');
                setSelectKey(['/product_discovery']);
              },
            },
          ]}
          footer={{
            collapseButton: true,
          }}
        />
      </Sider>
      <Layout>
        <Content
          style={{
            padding: '24px',
            backgroundColor: 'var(--semi-color-bg-0)',
          }}
        >
          <Outlet />
        </Content>
        <Footer
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '20px',
            color: 'var(--semi-color-text-2)',
            backgroundColor: 'rgba(var(--semi-grey-0), 1)',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span>
              Copyright © 2024 <a href="https://www.trumandu.top">TrumanDu</a>.
              All Rights Reserved.{' '}
            </span>
          </span>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
