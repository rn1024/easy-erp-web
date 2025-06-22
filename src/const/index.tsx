import type { TreeDataNode } from 'antd';
import { FormattedMessage } from 'react-intl';

export interface ExtendedTreeDataNode extends TreeDataNode {
  children?: ExtendedTreeDataNode[];
  type?: 'data' | 'action';
  defaultChecked?: string;
  options?: {
    label: React.ReactNode;
    value: string;
  }[];
}

export const permissionData: ExtendedTreeDataNode[] = [
  {
    title: <FormattedMessage id="pm.Users" />,
    key: 'Users',
    children: [
      {
        title: <FormattedMessage id="pm.Users_Users" />,
        key: 'Users_Users',
        children: [
          {
            title: <FormattedMessage id="pm.Users_Users_Details" />,
            key: 'Users_Users_Details',
            children: [
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Mute" />,
                key: 'Users_Users_Details_Mute',
              },
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Disable" />,
                key: 'Users_Users_Details_Disable',
              },
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Unmute" />,
                key: 'Users_Users_Details_Unmute',
              },
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Enable" />,
                key: 'Users_Users_Details_Enable',
              },
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Manage-Profile" />,
                key: 'Users_Users_Details_Manage-Profile',
              },
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Freeze-Funds" />,
                key: 'Users_Users_Details_Freeze-Funds',
              },
              {
                title: <FormattedMessage id="pm.Users_Users_Details_Unfreeze-Funds" />,
                key: 'Users_Users_Details_Unfreeze-Funds',
              },
            ],
          },
          {
            title: <FormattedMessage id="pm.Users_Users_Export" />,
            key: 'Users_Users_Export',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Users_Identity-Verification-History" />,
        key: 'Users_Identity-Verification-History',
        children: [
          {
            title: <FormattedMessage id="pm.Users_Identity-Verification-History_Export" />,
            key: 'Users_Identity-Verification-History_Export',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Users_Sanction-History" />,
        key: 'Users_Sanction-History',
      },
      {
        title: <FormattedMessage id="pm.Users_Usernames" />,
        key: 'Users_Usernames',
        children: [
          {
            title: <FormattedMessage id="pm.Users_Usernames_Add" />,
            key: 'Users_Usernames_Add',
          },
          {
            title: <FormattedMessage id="pm.Users_Usernames_Import" />,
            key: 'Users_Usernames_Import',
          },
          {
            title: <FormattedMessage id="pm.Users_Usernames_Delete" />,
            key: 'Users_Usernames_Delete',
          },
          {
            title: <FormattedMessage id="pm.Users_Usernames_Bulk-Delete" />,
            key: 'Users_Usernames_Bulk-Delete',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Users_Celebrities" />,
        key: 'Users_Celebrities',
        children: [
          {
            title: <FormattedMessage id="pm.Users_Celebrities_Add" />,
            key: 'Users_Celebrities_Add',
          },
          {
            title: <FormattedMessage id="pm.Users_Celebrities_Delete" />,
            key: 'Users_Celebrities_Delete',
          },
          {
            title: <FormattedMessage id="pm.Users_Celebrities_Export" />,
            key: 'Users_Celebrities_Export',
          },
        ],
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Content" />,
    key: 'Content',
    children: [
      {
        title: <FormattedMessage id="pm.Content_Shorts" />,
        key: 'Content_Shorts',
        children: [
          {
            title: <FormattedMessage id="pm.Content_Shorts_Delete" />,
            key: 'Content_Shorts_Delete',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Content_Shorts-Comments" />,
        key: 'Content_Shorts-Comments',
        children: [
          {
            title: <FormattedMessage id="pm.Content_Shorts-Comments_Delete" />,
            key: 'Content_Shorts-Comments_Delete',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Content_Live" />,
        key: 'Content_Live',
        children: [
          {
            title: <FormattedMessage id="pm.Content_Live_End" />,
            key: 'Content_Live_End',
          },
          {
            title: <FormattedMessage id="pm.Content_Live_Delete" />,
            key: 'Content_Live_Delete',
          },
        ],
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Clone" />,
    key: 'Clone',
    children: [
      {
        title: <FormattedMessage id="pm.Clone_Preset-Questions" />,
        key: 'Clone_Preset-Questions',
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Super-Users" />,
    key: 'Super-Users',
    children: [
      {
        title: <FormattedMessage id="pm.Super-Users_Behavior" />,
        key: 'Super-Users_Behavior',
        children: [
          {
            title: <FormattedMessage id="pm.Super-Users_Behavior_Edit" />,
            key: 'Super-Users_Behavior_Edit',
          },
        ],
      },
      {
        title: <FormattedMessage id="m.Super-Users_Benefit" />,
        key: 'Super-Users_Benefit',
        children: [
          {
            title: <FormattedMessage id="pm.Super-Users_Benefit_Add" />,
            key: 'Super-Users_Benefit_Add',
          },
          {
            title: <FormattedMessage id="pm.Super-Users_Benefit_Edit" />,
            key: 'Super-Users_Benefit_Edit',
          },
          {
            title: <FormattedMessage id="pm.Super-Users_Benefit_Delete" />,
            key: 'Super-Users_Benefit_Delete',
          },
        ],
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Creator_Center" />,
    key: 'Creator-Center',
    children: [
      {
        title: <FormattedMessage id="pm.Creator_Center-Topic" />,
        key: 'Creator-Center_Topic',
      },
      {
        title: <FormattedMessage id="pm.Creator_Center-Creator_Hub" />,
        key: 'Creator-Center_Creator-Hub',
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Client-Config" />,
    key: 'Client-Config',
    children: [
      {
        title: <FormattedMessage id="pm.Client-Config_Plaza-Config" />,
        key: 'Client-Config_Plaza-Config',
      },
      {
        title: <FormattedMessage id="pm.Client-Config_Airdrop-Whitelist" />,
        key: 'Client-Config_Super-Users',
        children: [
          {
            title: <FormattedMessage id="pm.Client-Config_Super-Users_Add" />,
            key: 'Client-Config_Super-Users_Add',
          },
          {
            title: <FormattedMessage id="pm.Client-Config_Super-Users_Edit" />,
            key: 'Client-Config_Super-Users_Edit',
          },
          {
            title: <FormattedMessage id="pm.Client-Config_Super-Users_Delete" />,
            key: 'Client-Config_Super-Users_Delete',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Client-Config_Domain" />,
        key: 'Client-Config_Domain',
      },
      {
        title: <FormattedMessage id="pm.Client-Config_App-Version" />,
        key: 'Client-Config_App-Version',
      },
      {
        title: <FormattedMessage id="pm.Client-Config_Channel-Code" />,
        key: 'Client-Config_Channel-Code',
        children: [
          {
            title: <FormattedMessage id="pm.Add" />,
            key: 'Client-Config_Channel-Code_Add',
          },
          {
            title: <FormattedMessage id="pm.Edit" />,
            key: 'Client-Config_Channel-Code_Edit',
          },
          {
            title: <FormattedMessage id="pm.Export" />,
            key: 'Client-Config_Channel-Code_Export',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Client-Config_Live-Recommendations" />,
        key: 'Client-Config_Live-Recommendations',
        children: [
          {
            title: <FormattedMessage id="pm.Add" />,
            key: 'Client-Config_Live-Recommendations_Add',
          },
          {
            title: <FormattedMessage id="pm.Delete" />,
            key: 'Client-Config_Live-Recommendations_Delete',
          },
        ],
      },
    ],
  },
  {
    title: 'IM',
    key: 'IM',
    children: [
      {
        title: <FormattedMessage id="pm.IM_Messages" />,
        key: 'IM_Messages',
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Marketplace" />,
    key: 'Marketplace',
    children: [
      {
        title: <FormattedMessage id="pm.Marketplace_NFT" />,
        key: 'Marketplace_NFT',
        children: [
          {
            title: <FormattedMessage id="pm.Marketplace_NFT_NFT-Collection" />,
            key: 'Marketplace_NFT_NFT-Collection',
          },
          {
            title: <FormattedMessage id="pm.Marketplace_NFT_NFT" />,
            key: 'Marketplace_NFT_NFT',
          },
          {
            title: <FormattedMessage id="pm.Marketplace_NFT_NFT-Marketplace" />,
            key: 'Marketplace_NFT_NFT-Marketplace',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Marketplace_Token" />,
        key: 'Marketplace_Token',
        children: [
          {
            title: <FormattedMessage id="pm.Marketplace_Token_Token-Config" />,
            key: 'Marketplace_Token_Token-Config',
            children: [
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Token-Config_Edit" />,
                key: 'Marketplace_Token_Token-Config_Edit',
              },
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Token-Config_Sort" />,
                key: 'Marketplace_Token_Token-Config_Sort',
              },
            ],
          },
          {
            title: <FormattedMessage id="pm.Marketplace_Token_Pool" />,
            key: 'Marketplace_Token_Pool',
            children: [
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Pool_Create" />,
                key: 'Marketplace_Token_Pool_Add',
              },
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Pool_Edit" />,
                key: 'Marketplace_Token_Pool_Edit',
              },
            ],
          },
          {
            title: <FormattedMessage id="pm.Marketplace_Token_Top-Token" />,
            key: 'Marketplace_Token_Top-Token',
            children: [
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Top-Token_Add" />,
                key: 'Marketplace_Token_Top-Token_Add',
              },
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Top-Token_Sort" />,
                key: 'Marketplace_Token_Top-Token_Sort',
              },
              {
                title: <FormattedMessage id="pm.Marketplace_Token_Top-Token_Delete" />,
                key: 'Marketplace_Token_Top-Token_Delete',
              },
            ],
          },
        ],
      },
      {
        title: 'Meme',
        key: 'Marketplace_Meme',
        children: [
          {
            title: 'Memecoin',
            key: 'Marketplace_Meme_Memecoin',
            children: [
              {
                title: <FormattedMessage id="pm.Marketplace_Meme_Memecoin_Delist" />,
                key: 'Marketplace_Meme_Memecoin_Delist',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.Airdrop" />,
    key: 'Airdrop',
    children: [
      {
        title: <FormattedMessage id="pm.Airdrop_Airdrop-Seasons" />,
        key: 'Airdrop_Airdrop-Seasons',
        children: [
          {
            title: <FormattedMessage id="pm.Airdrop_Airdrop-Seasons_Create" />,
            key: 'Airdrop_Airdrop-Seasons_Create',
          },
          {
            title: <FormattedMessage id="pm.Airdrop_Airdrop-Seasons_Edit" />,
            key: 'Airdrop_Airdrop-Seasons_Edit',
          },
          {
            title: <FormattedMessage id="pm.Airdrop_Airdrop-Seasons_Delete" />,
            key: 'Airdrop_Airdrop-Seasons_Delete',
          },
          {
            title: <FormattedMessage id="pm.Airdrop_Airdrop-Seasons_Distribute" />,
            key: 'Airdrop_Airdrop-Seasons_Distribute',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.Airdrop_Airdrop-Config" />,
        key: 'Airdrop_Airdrop-Config',
        children: [
          {
            title: <FormattedMessage id="pm.Airdrop_Airdrop-Config_Edit" />,
            key: 'Airdrop_Airdrop-Config_Edit',
          },
        ],
      },
    ],
  },
  {
    title: <FormattedMessage id="pm.System-Management" />,
    key: 'System-Management',
    children: [
      {
        title: <FormattedMessage id="pm.System-Management_Accounts" />,
        key: 'System-Management_Accounts',
        children: [
          {
            title: <FormattedMessage id="pm.System-Management_Accounts_Create" />,
            key: 'System-Management_Accounts_Create',
          },
          {
            title: <FormattedMessage id="pm.System-Management_Accounts_Edit" />,
            key: 'System-Management_Accounts_Edit',
          },
          {
            title: <FormattedMessage id="pm.System-Management_Accounts_Delete" />,
            key: 'System-Management_Accounts_Delete',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.System-Management_Roles" />,
        key: 'System-Management_Roles',
        children: [
          {
            title: <FormattedMessage id="pm.System-Management_Roles_Create" />,
            key: 'System-Management_Roles_Create',
          },
          {
            title: <FormattedMessage id="pm.System-Management_Roles_Edit" />,
            key: 'System-Management_Roles_Edit',
          },
          {
            title: <FormattedMessage id="pm.System-Management_Roles_Delete" />,
            key: 'System-Management_Roles_Delete',
          },
          {
            title: <FormattedMessage id="pm.System-Management_Permissions" />,
            key: 'System-Management_Permissions',
          },
        ],
      },
      {
        title: <FormattedMessage id="pm.System-Management_Logs" />,
        key: 'System-Management_Logs',
      },
      {
        title: <FormattedMessage id="pm.System-Management_Exports" />,
        key: 'System-Management_Downloads',
        type: 'data',
        defaultChecked: 'System-Management_Downloads_Personal-Data',
        options: [
          {
            label: <FormattedMessage id="pm.System-Management_Exports_Exports_All-Data" />,
            value: 'System-Management_Downloads_All-Data',
          },
          {
            label: <FormattedMessage id="pm.System-Management_Exports_Exports_Personal-Data" />,
            value: 'System-Management_Downloads_Personal-Data',
          },
        ],
      },
    ],
  },
];
