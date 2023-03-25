import React, { useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ProfileForm from "@/components/forms/ProfileForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Note from "@/components/ui/Note";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import apiPaths, { EVT_SUBMISSION_PRESENTATION_TYPES } from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import SanitizedHTML from "react-sanitized-html";
import { faFlask } from "@fortawesome/free-solid-svg-icons";
import { getSession, useSession } from "next-auth/client";
import { useRouter } from "next/router";
import submissions from "@/pages/admin/events/[eventId]/registrations/[registrationId]/submissions";
import DateTime from "@/components/ui/Input/components/DateTime";
import { some } from "lodash";

const UploadAbstract = ({ userSubmission, submission, event }) => {
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();
  const [session, loading] = useSession();
  const { addToast } = useToasts();
  const router = useRouter();

  const editingDeadline = submission?.submission_types
    .filter((item) => userSubmission?.presentation_types?.includes(item.id))
    ?.reduce(function (a, b) {
      return new DateTime(a.editing_deadline) < b.editing_deadline ? a : b;
    });

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  const { control, errors, handleSubmit } = useForm({
    defaultValues: {
      presentation_file: userSubmission?.presentation_file,
      full_paper_file: userSubmission?.full_paper_file,
    },
  });

  const onSubmit = async (params, { redirectToNextStep }) => {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(),
    };

    const requestParams = requestParamBuilder(params, {
      formData: true,
      isPut: true,
    });

    const userSubmissionResponse = await api({
      headers,
      method: "POST",
      data: requestParams,
      url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
        eventId: router.query.eventId,
        submissionId: router.query.submissionId,
        userSubmissionId: userSubmission.id,
      }),
    });

    redirectToNextStep({
      query: {
        userSubmissionId: userSubmissionResponse.data.data.id,
      },
    });
  };

  return (
    <Wizard
      {...{ steps }}
      onPrevious={({ redirectToPreviousStep }) => {
        redirectToPreviousStep({
          query: { userSubmissionId: userSubmission?.id },
        });
      }}
      onNext={({ redirectToNextStep }) =>
        handleSubmit((params) => onSubmit(params, { redirectToNextStep }))()
      }
    >
      <div className="col-md-4 offset-md-4">
        {!some(submission?.submission_types, {
          allow_presentation_upload: true,
        }) &&
          !some(submission?.submission_types, {
            allow_presentation_upload: true,
          }) && <Note color="warning">Upload has been disabled</Note>}

        {some(submission?.submission_types, {
          allow_presentation_upload: true,
        }) && (
          <div className="form-group">
            <Label>Full Paper upload</Label>
            <Controller
              name="full_paper_file"
              control={control}
              render={({ name, value, onChange }) => (
                <Input.File
                  name={name}
                  defaultValue={value}
                  onChange={onChange}
                  feedback={
                    errors?.full_paper_file && errors?.full_paper_file?.message
                  }
                />
              )}
            />
          </div>
        )}

        {some(submission?.submission_types, {
          allow_presentation_upload: true,
        }) && (
          <div className="form-group">
            <Label>Presentation File</Label>
            <Controller
              name="presentation_file"
              control={control}
              render={({ name, value, onChange }) => (
                <Input.File
                  name={name}
                  defaultValue={value}
                  onChange={onChange}
                  feedback={
                    errors?.full_paper_file &&
                    errors?.presentation_file?.message
                  }
                />
              )}
            />
          </div>
        )}
      </div>
    </Wizard>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        if (context.query.userSubmissionId) {
          const headers = {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(context.req),
          };

          const userSubmissionResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
              userSubmissionId: context.query.userSubmissionId,
              query: {
                include: "userSubmissionUser,authors,authors.affiliations",
              },
            }),
          });

          return {
            props: {
              headers,
              session,
              context: await getContextProps(context),
              userSubmission: userSubmissionResponse.data.data,
              ...pipeProps,
            },
          };
        }

        return {
          props: {
            session,
            context: await getContextProps(context),
            ...pipeProps,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

UploadAbstract.authorized = true;
UploadAbstract.Layout = DashboardLayout;

export default UploadAbstract;
