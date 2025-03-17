import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $lastRun: DateTime!) {
    updateUser(id: $id, lastRun: $lastRun) {
      id
      lastRun
    }
  }
`;