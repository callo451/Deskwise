import React from 'react';
import { Change, ChangeStatus } from '../../types/database';
import { Tab } from '@headlessui/react';
import { 
  DocumentTextIcon, 
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CalendarIcon,
  LinkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ChangeDetailOverview from './ChangeDetailOverview';
import ChangeDetailImplementation from './ChangeDetailImplementation';
import ChangeApprovals from './ChangeApprovals';
import ChangeSchedule from './ChangeSchedule';
import ChangeLinks from './ChangeLinks';
import ChangeHistory from './ChangeHistory';

interface ChangeDetailTabsProps {
  change: Change;
  isEditing: boolean;
  canEdit: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onChangeUpdate: (updatedChange: Partial<Change>) => void;
  onStatusChange: (newStatus: ChangeStatus) => void;
  onRefresh: () => void;
}

const ChangeDetailTabs: React.FC<ChangeDetailTabsProps> = ({
  change,
  isEditing,
  canEdit,
  activeTab,
  onTabChange,
  onChangeUpdate,
  onStatusChange,
  onRefresh
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
    { id: 'implementation', label: 'Implementation', icon: ClipboardDocumentCheckIcon },
    { id: 'approvals', label: 'Approvals', icon: UserGroupIcon },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'history', label: 'History', icon: ClockIcon }
  ];
  
  const selectedTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  return (
    <div className="flex-1 overflow-hidden">
      <Tab.Group selectedIndex={selectedTabIndex} onChange={(index) => onTabChange(tabs[index].id)}>
        <Tab.List className="flex border-b border-gray-200 bg-white px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  `flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </Tab>
            );
          })}
        </Tab.List>
        <Tab.Panels className="flex-1 overflow-auto">
          <Tab.Panel className="p-6">
            <ChangeDetailOverview
              change={change}
              isEditing={isEditing}
              onChangeUpdate={onChangeUpdate}
              onStatusChange={onStatusChange}
              canEdit={canEdit}
            />
          </Tab.Panel>
          <Tab.Panel className="p-6">
            <ChangeDetailImplementation
              change={change}
              isEditing={isEditing}
              onChangeUpdate={onChangeUpdate}
            />
          </Tab.Panel>
          <Tab.Panel className="p-6">
            <ChangeApprovals
              change={change}
              canEdit={canEdit}
              onRefresh={onRefresh}
            />
          </Tab.Panel>
          <Tab.Panel className="p-6">
            <ChangeSchedule
              change={change}
              isEditing={isEditing}
              canEdit={canEdit}
              onChangeUpdate={onChangeUpdate}
              onRefresh={onRefresh}
            />
          </Tab.Panel>
          <Tab.Panel className="p-6">
            <ChangeLinks
              change={change}
              onRefresh={onRefresh}
            />
          </Tab.Panel>
          <Tab.Panel className="p-6">
            <ChangeHistory
              changeId={change.id}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ChangeDetailTabs;
