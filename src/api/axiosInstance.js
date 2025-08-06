// THIS IS INTERCEPTOR 
import axios from 'axios';

// const stagingToken = `4Qw8CbN6g4yXq8Tvz5cam2hQ4+w8bcxtzd6urPhTQXmxNjwhtS1muNIkkQNaUxbJD5IijKDLKHH+mW3ZkCJmpZI8c1DBT1CjpBsGko8VVZfpv0iLXUV/ZKjoVoLMmYnX7ddZTvHYCPIooVcCXKdbqhYIXqODq7bl2WOJhtYCli+YMSu2PjgaorVTdv4Q8GlIOZNRoI/+yr9i7IGO52jSSNRBwOEmHKZL3E/e4j/c6abEQVulPz+K6U0pIAgJGv7grg+Jx0a727dgHp0E1zQkQS6JMHWH5Cy6D5zyvvMCiIjKv2I/Jb8IMAayXo2CyKYq/URanRoJTxv+9npNAL4WqeJVkiZPGh2nch0YFGu/FZpcO9eXhkie86DXcK9fJrsremf081jF+DhxNR4PAZu6/esD35vhmmtxpBKdFV1ytS+qQZCTapBBoZgZj2vPvQqsZTjQBtF09UKdLZp4xPwUSnfU+lIhF0sNOPSTr3y1ok585KWOSTEO4rAEfJ+qmfrKMqLQa4BK14388mZb1xJw7Q==`;

const stagingToken = `4Qw8CbN6g4yXq8Tvz5cam2hQ4+w8bcxtzd6urPhTQXmxNjwhtS1muNIkkQNaUxbJ/XdIZqryFXq01ISy81Fm+w4LDY7L0PiUSrfqLCVghy16Ko8d9OIPcYDZKkqAh80Mqj88ab2Od6Kf4s0AYxypkdYSKMo40Zs1UczX1QKy1kN3mZQRmGYbzqjBEITFe4MaOfMDtA/U6U2ObEQFnn8xwFsH9Pe7y3A9lT2SNW2lPxaWNIWCpZC/cEuHJOxGPzVBajmJFhndCgfUu2UoI6QguljLzE+x1YpFIYgIQI1gfvZuzBkmhKdbjixsN/MX2KKO8y2ylMOd86avWF48Hs6U0HMOC5q3CkanwWNrjP+cdgekGiI+EDeGtXZ6WIcnwjiiGXU6VldrV5j8BoMTb9+S9n+e2MIkOlzVEUYHt6le0tVaNESBjyLq4RhYi1jqdgPwfaIpoIZw+oU3dyf0ba3+FWyMxhUwH4C0W6s1VnPSJyAAkuk+D+guOMlUsIm7VD+lP9atZpefSXzasy0aPWXXqQ==`


const apiBaseUrl = process.env.REACT_APP_API_URL;
const axiosInstance = axios.create({
  baseURL: apiBaseUrl, 
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${stagingToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
