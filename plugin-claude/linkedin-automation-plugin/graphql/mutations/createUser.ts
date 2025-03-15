import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($email: String!, $password: String!, $profileUrl: String!) {
    createUser(input: { email: $email, password: $password, profileUrl: $profileUrl }) {
      id
      email
      profileUrl
    }
  }
`;