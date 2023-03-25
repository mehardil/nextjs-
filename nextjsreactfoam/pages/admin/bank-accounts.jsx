import { getSession } from "next-auth/client";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Icon from "@/components/ui/Icon";
import { useRouter } from "next/router";
import Link from "next/link";
import Button from "@/components/ui/Button";
import SweetAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import getContextProps from "@/utils/getContextProps";
import nextApi from "@/utils/nextApi";
import api from "@/utils/api";
import React from "react";
import BankAccountModal from "@/components/modals/BankAccountModal";
import queryString from "query-string";
import getTenant from "@/utils/getTenant";
import PageHeader from "@/components/common/PageHeader";
import paths from "@/routes/paths";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";

const BankAccount = ({ bank_accounts, context, session, meta }) => {
  const { addToast } = useToasts();
  const initialNumOfEntries = context.query.perPage;
  const [bankAccount, setBankAccount] = React.useState(bank_accounts);
  const [isNewBankAccountAdded, setNewBankAccountAdded] = React.useState(false);
  const [isEditBankAccModalActive, setEditBankAccModalActive] = React.useState(
    false
  );
  const [isBankAccountModalActive, setBankAccountModalActive] = React.useState(
    false
  );
  const router = useRouter();
  const t = useTranslations();
  const [toEditBankAcc, setToEditBankAcc] = React.useState();
  const [isSaving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [toDeleteBankAccId, setToDeleteBankAccId] = React.useState();

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "bsb",
      label: "Bsb",
    },
    {
      key: "use_subaccounts",
      label: "Use Sub Accounts",
    },
    {
      key: "bank",
      label: "Bank",
    },
    {
      key: "branch",
      label: "Branch",
    },
    {
      key: "account_number",
      label: "Account Number",
    },
    {
      key: "swift_code",
      label: "Swift Code",
    },
    {
      key: "action",
      label: "Action",
    },
  ];

  const dropdownOptions = (item) => {
    return [
      {
        label: (
          <>
            <Icon icon="trash" />
            &nbsp;Delete
          </>
        ),
        onClick: () => {
          handleDelete(item.id);
        },
      },
    ];
  };
  const handleEdit = (item) => {
    setToEditBankAcc(item);
    setBankAccountModalActive(true);
  };
  const handleDelete = (id) => {
    setToDeleteBankAccId(id);
    setShowDeleteConfirm(true);
  };
  const refreshData = () => {
    router.replace(router.asPath);
  };

  /*update  */
  const onSaveChanges = async (params) => {
    setSaving(true);

    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.put(
        `/bank-accounts/${toEditBankAcc?.id}`,
        params,
        { headers }
      );

      refreshData();
      addToast("Bank account has successfully updated", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to updated bank account", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  /*Delete  */
  const onConfirmDelete = async () => {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.delete(
        `/bank-accounts/${toDeleteBankAccId}`,

        { headers }
      );

      refreshData();
      addToast("Bank account has successfully Delete", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to Delete bank account", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setToEditBankAcc();
        setBankAccountModalActive(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.bankAccount", { entries: 1 }),
      })}
    </Button>
  );

  const onSubmit = async (data) => {
    toEditBankAcc?.id ? onSaveChanges(data) : onCreate(data);
  };

  const onCreate = async (params) => {
    setSaving(true);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    /* USING ASYNC WE USE TRY ,CATCH AND FINALLY TO CATCH SERVER EROORS INSTEAD OF .THAN  */
    try {
      const data = await api.post("/bank-accounts", params, { headers });

      const refreshData = () => {
        router.replace(router.asPath);
      };
      refreshData();

      addToast("Successfully added Bank Accounts", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to added Bank Accounts", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setNewBankAccountAdded(true);
      setBankAccountModalActive(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Bank Account" toolbar={pageHeaderToolbar} />
      <Panel maximizable color="inverse" title={<>Bank Account</>}>
        <div className="clearfix"> </div>

        {isBankAccountModalActive && (
          <BankAccountModal
            onSubmit={onSubmit}
            isSaving={isSaving}
            isShow={isBankAccountModalActive}
            onHide={() => setBankAccountModalActive(false)}
            defaultValues={toEditBankAcc}
            items={bankAccount}
          />
        )}

        <Table
          items={bankAccount}
          columns={columns}
          batchActions={[]}
          bordered
          {...{ initialNumOfEntries }}
          initialPage={meta.current_page}
          onPageChange={handlePageChange}
          onKeywordChange={handleKeywordChange}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}
          scopedSlots={{
            bsb: (item) => <td>{item.bsb}</td>,
            use_subaccounts: (item) => <td>{item.use_subaccounts}</td>,
            name: (item) => <td>{item.name}</td>,
            bank: (item) => <td>{item.bank}</td>,
            branch: (item) => <td>{item.branch}</td>,
            account_number: (item) => <td>{item.account_number}</td>,
            swift_code: (item) => <td>{item.swift_code}</td>,

            action: (item) => (
              <td className="m-4">
                <div className="d-flex">
                  <Button.Dropdown
                    size="xs"
                    color="white"
                    options={dropdownOptions(item)}
                  >
                    <Button onClick={() => handleEdit(item)}>Edit</Button>
                  </Button.Dropdown>
                </div>
              </td>
            ),
          }}
        />

        {showDeleteConfirm && (
          <SweetAlert
            danger
            showCancel
            confirmBtnText="Delete"
            confirmBtnBsStyle="danger"
            title="Delete Confirmation"
            focusCancelBtn
            type="danger"
            desc="Are you sure you want to delete this Bank Account?"
            onConfirm={onConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            Are you sure you want to delete this bank account?
          </SweetAlert>
        )}
      </Panel>
    </ContentErrorBoundary>
  );
};

/* get data from  */
export const getServerSideProps = async (context) => {
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });
  const session = await getSession(context);

  if (session) {
    const response = await api({
      url: `/bank-accounts?${urlQueryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    return {
      props: {
        session,
        context: await getContextProps(context),
        bank_accounts: response.data.data,
        meta: response.data.meta,
      },
    };
  }

  return {
    props: {},
  };
};
BankAccount.authorized = true;
BankAccount.allowedRoles = [ADMIN];
BankAccount.Layout = DashboardLayout;
BankAccount.defaultProps = {
  BankAccount: [],
};

export default BankAccount;
